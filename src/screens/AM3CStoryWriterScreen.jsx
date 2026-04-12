// AM3CStoryWriterScreen — WrenchIQ-AM 3C Story Writer
// Generates Complaint / Cause / Correction narratives for independent shop ROs.
// Customer-pay focused (not warranty). Uses am3cDemoRegistry for demo data.

import { useState, useEffect } from "react";
import {
  FileText, Sparkles, CheckCircle, AlertCircle, Send,
  ChevronRight, Car, Globe, RotateCcw, Search,
  Printer, DollarSign, MapPin,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP, repairOrders, customers, vehicles } from "../data/demoData";
import AIInsightsStrip from "../components/AIInsightsStrip";

// New pipeline / service imports
import { DEMO_REGISTRY } from "../data/am3cDemoRegistry";
import { createROContext, advanceStage, getStageProgress, STAGES } from "../services/am3cPipelineService";
import { classifyBatch } from "../services/am3cClassificationService";
import { assembleDocument } from "../services/am3cAssemblyService";
import { computeScore } from "../services/am3cScoreService";
import { validateDocument } from "../services/am3cFactualityService";
import { getDemoFindings } from "../services/am3cDVIService";
import { queryTSBCorpus } from "../services/am3cTSBService";
import { getDemoDTCs } from "../services/am3cDTCService";
import { buildReferencesFromContext } from "../services/am3cReferenceService";
import { generateNarrative } from "../services/am3cLLMService";
import ROActivePanel from "../components/am3c/ROActivePanel";

// ── NHTSA API ─────────────────────────────────────────────────

async function fetchNHTSARecalls(make, model, year) {
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// ── Build RO list from demoData (matches RO Queue & Board) ───

const STATUS_LABEL = {
  in_progress:    "In Progress",
  inspecting:     "Inspecting",
  estimate_sent:  "Estimate Sent",
  checked_in:     "Checked In",
  approved:       "Approved",
  ready:          "Ready",
  complete:       "Complete",
};

const DEMO_ROS = repairOrders.map(ro => {
  const customer = customers.find(c => c.id === ro.customerId) || {};
  const vehicle  = vehicles.find(v => v.id === ro.vehicleId) || {};
  return {
    id:           ro.id,
    vin:          vehicle.vin || "",
    status:       STATUS_LABEL[ro.status] || "Pending",
    customerName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
    concern:      ro.serviceType,
    vehicle,
    services:     ro.services || [],
  };
});

// ── Bay data (demo) ───────────────────────────────────────────

const SHOP_BAYS = [
  { id: 1, name: "Bay 1", tech: "DeShawn W.", status: "in_use",    estFree: "1:45 PM" },
  { id: 2, name: "Bay 2", tech: "Marcus R.",  status: "in_use",    estFree: "2:30 PM" },
  { id: 3, name: "Bay 3", tech: "James K.",   status: "in_use",    estFree: "12:30 PM" },
  { id: 4, name: "Bay 4", tech: "Sofia L.",   status: "starting",  estFree: "Now" },
  { id: 5, name: "Bay 5", tech: null,         status: "available", estFree: null },
  { id: 6, name: "Bay 6", tech: null,         status: "available", estFree: null },
];

const BAY_STATUS_STYLE = {
  in_use:    { dot: "#FF6B35", label: "In Use",    bg: "#FFF7ED", border: "#FED7AA" },
  starting:  { dot: "#F59E0B", label: "Starting",  bg: "#FFFBEB", border: "#FDE68A" },
  available: { dot: "#16A34A", label: "Open",      bg: "#F0FDF4", border: "#BBF7D0" },
};

function BaySelector({ selected, onSelect }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={11} color={COLORS.textMuted} />
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.06 }}>
            Bay Assignment
          </span>
        </div>
        {selected != null ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
            {SHOP_BAYS.find(b => b.id === selected)?.name} assigned
          </span>
        ) : (
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>Select an open bay to queue</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {SHOP_BAYS.map(bay => {
          const s = BAY_STATUS_STYLE[bay.status];
          const isSelected = selected === bay.id;
          const isOpen = bay.status === "available";
          return (
            <div
              key={bay.id}
              onClick={() => isOpen && onSelect(isSelected ? null : bay.id)}
              title={isOpen ? `Assign to ${bay.name}` : `${bay.name} — ${bay.tech} (free ~${bay.estFree})`}
              style={{
                flex: 1,
                background: isSelected ? `${COLORS.primary}12` : s.bg,
                border: `1.5px solid ${isSelected ? COLORS.primary : s.border}`,
                borderRadius: 8,
                padding: "7px 5px",
                cursor: isOpen ? "pointer" : "default",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: isSelected ? COLORS.primary : s.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? COLORS.primary : COLORS.textPrimary }}>
                  {bay.name}
                </span>
              </div>
              <div style={{ fontSize: 9, color: COLORS.textMuted, lineHeight: 1.3 }}>
                {bay.tech || s.label}
              </div>
              {bay.estFree && (
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>~{bay.estFree}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    "In Progress":    { bg: "#DBEAFE", color: "#1D4ED8" },
    "Inspecting":     { bg: "#FEF3C7", color: "#92400E" },
    "Estimate Sent":  { bg: "#EDE9FE", color: "#6D28D9" },
    "Checked In":     { bg: "#E0F2FE", color: "#0369A1" },
    "Approved":       { bg: "#DCFCE7", color: "#15803D" },
    "Ready":          { bg: "#D1FAE5", color: "#065F46" },
    "Complete":       { bg: "#DCFCE7", color: "#15803D" },
    "Pending":        { bg: "#F3F4F6", color: "#6B7280" },
  };
  const s = map[status] || map["Pending"];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
      background: s.bg, color: s.color,
      borderRadius: 4, padding: "2px 6px",
    }}>
      {status.toUpperCase()}
    </span>
  );
}

function scoreColor(s) {
  if (s >= 85) return "#16A34A";
  if (s >= 65) return "#D97706";
  return "#DC2626";
}

function ScoreMeter({ score }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${score}%`, height: "100%",
          background: color, borderRadius: 3, transition: "width 0.4s",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 36 }}>{score}</span>
    </div>
  );
}

function NarrativeBlock({ label, color, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.06 }}>
          {label}
        </span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "10px 12px",
          fontSize: 12, lineHeight: 1.6,
          color: COLORS.textPrimary,
          background: "#FAFAFA",
          resize: "vertical",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

// ── Stage Progress Bar (inline, middle panel) ─────────────────

function InlineStagePipeline({ roContext }) {
  if (!roContext) return null;
  const progress = getStageProgress(roContext);
  return (
    <div style={{
      background: "#F9FAFB",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 16,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: COLORS.textSecondary,
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
      }}>
        Pipeline — {progress.completed}/{progress.total} stages complete ({progress.percentage}%)
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {progress.stages.map((stage, idx) => {
          const isCompleted = stage.status === "completed" || stage.status === "skipped";
          const isCurrent   = stage.status === "current";
          const isPending   = stage.status === "pending";

          let circleBg     = "#E5E7EB";
          let circleColor  = "#9CA3AF";
          let circleBorder = "none";

          if (isCompleted) {
            circleBg    = COLORS.primary;
            circleColor = "#fff";
          } else if (isCurrent) {
            circleBg    = COLORS.accent;
            circleColor = "#fff";
          } else if (isPending) {
            circleBg    = "#fff";
            circleColor = "#D1D5DB";
            circleBorder = "1.5px solid #D1D5DB";
          }

          return (
            <div key={stage.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                <div style={{
                  flex: 1, height: 1,
                  background: idx === 0 ? "transparent" : (isCompleted || isCurrent ? COLORS.primary : "#E5E7EB"),
                }} />
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: circleBg, border: circleBorder,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isCompleted ? (
                    <CheckCircle size={9} color="#fff" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
                  ) : null}
                </div>
                <div style={{
                  flex: 1, height: 1,
                  background: idx === progress.stages.length - 1 ? "transparent" : (isCompleted ? COLORS.primary : "#E5E7EB"),
                }} />
              </div>
              <div style={{
                fontSize: 8, marginTop: 3, textAlign: "center",
                color: isCurrent ? COLORS.accent : isCompleted ? COLORS.primary : "#9CA3AF",
                fontWeight: isCurrent || isCompleted ? 700 : 400,
                lineHeight: 1.2, maxWidth: 38, wordBreak: "break-word",
              }}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export default function AM3CStoryWriterScreen({ onOpenReview, onOpenAdmin }) {
  const [selectedROId, setSelectedROId]     = useState(DEMO_ROS[0]?.id || null);
  const [complaint, setComplaint]           = useState("");
  const [cause, setCause]                   = useState("");
  const [correction, setCorrection]         = useState("");
  const [techNotes, setTechNotes]           = useState("");
  const [generationMode, setGenerationMode] = useState("short"); // 'short' | 'verbose' | 'llm'
  const [llmError, setLlmError]             = useState(null);
  const [generating, setGenerating]         = useState(false);
  const [generated, setGenerated]           = useState(false);
  const [recallLoading, setRecallLoading]   = useState(false);
  const [recalls, setRecalls]               = useState([]);
  const [recallChecked, setRecallChecked]   = useState(false);
  const [recallError, setRecallError]       = useState(null);
  const [roSearch, setROSearch]             = useState("");

  const [bayAssignment, setBayAssignment]   = useState(null); // selected bay id

  // New pipeline state
  const [roContext, setROContext]           = useState(null);
  const [prediiScore, setPrediiScore]       = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [building, setBuilding]             = useState(false);
  const [assembledDoc, setAssembledDoc]     = useState(null);
  const [violations, setViolations]         = useState([]);

  const selectedRO  = DEMO_ROS.find(r => r.id === selectedROId) || DEMO_ROS[0];
  const vehicle     = selectedRO?.vehicle || null;

  // Display score: prefer prediiScore.overall if available, else simple heuristic
  const displayScore = prediiScore?.overall ?? (generated ? 72 : 0);

  const filteredROs = roSearch
    ? DEMO_ROS.filter(r =>
        r.id.toLowerCase().includes(roSearch.toLowerCase()) ||
        r.customerName.toLowerCase().includes(roSearch.toLowerCase()) ||
        r.concern.toLowerCase().includes(roSearch.toLowerCase())
      )
    : DEMO_ROS;

  // Pre-populate CCC from demo registry when RO changes
  useEffect(() => {
    const vin = DEMO_ROS.find(r => r.id === selectedROId)?.vin;
    const notes = vin ? (DEMO_REGISTRY[vin]?.classifiedNotes || []) : [];
    const get = section => notes.find(n => n.section === section)?.text || "";
    setComplaint(get("complaint"));
    setCause(get("cause"));
    setCorrection(get("correction"));
    setTechNotes("");
    setGenerated(false);
    setRecalls([]);
    setRecallChecked(false);
    setRecallError(null);
    setROContext(null);
    setPrediiScore(null);
    setAssembledDoc(null);
    setViolations([]);
    setBayAssignment(null);
  }, [selectedROId]);

  async function handleCheckRecalls() {
    if (!vehicle) return;
    setRecallLoading(true);
    setRecallError(null);
    try {
      const data = await fetchNHTSARecalls(vehicle.make, vehicle.model, vehicle.year);
      setRecalls(data);
      setRecallChecked(true);
    } catch {
      setRecallError("NHTSA API unavailable — using demo data");
      setRecalls([]);
      setRecallChecked(true);
    } finally {
      setRecallLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedRO) return;
    setGenerating(true);
    setBuilding(true);
    setLlmError(null);
    try {
      // Create or reuse RO context
      let ctx = roContext || createROContext(selectedRO.id, selectedRO.vin);

      // Attach vehicle to context
      if (vehicle) {
        ctx = { ...ctx, vehicle };
      }

      // Stage 1: customer intake
      ctx = advanceStage(ctx, "customer_intake", {
        intake: { complaint: selectedRO.concern, concern: selectedRO.concern, text: selectedRO.concern },
      });

      // Stage 2: DVI (demo mode)
      const dviFindings = getDemoFindings(selectedRO.vin);
      ctx = advanceStage(ctx, "mpi_dvi", {
        dviFindings: dviFindings.map(f => ({ ...f, actioned: f.status === "red" })),
      });

      // Stage 3: TSB match (demo mode)
      const tsbResult = await queryTSBCorpus(
        { vin: selectedRO.vin, ymme: selectedRO.vehicle, dtcCodes: [], complaintKeywords: [] },
        true
      );
      const tsbMatches = (tsbResult.matches || tsbResult || []).map(t => ({ ...t, accepted: true }));
      ctx = advanceStage(ctx, "tsb_match", { tsbMatches });

      // Stage 4: Diagnostic scan (demo mode)
      const dtcCodes = DEMO_REGISTRY[selectedRO.vin]?.dtcCodes || [];
      ctx = advanceStage(ctx, "diagnostic_scan", { dtcCodes });

      // Stage 5: Tech notes classification
      const notesToClassify = techNotes.trim() ? [techNotes] : [];
      const classified = notesToClassify.length > 0
        ? await classifyBatch(notesToClassify, ctx.vehicle, true)
        : [];
      ctx = advanceStage(ctx, "tech_notes", {
        classifiedNotes: classified,
        techNotes: notesToClassify,
      });

      // Stage 6: Work performed
      ctx = advanceStage(ctx, "work_performed", { partsInstalled: [], laborOps: [] });

      setROContext(ctx);

      // Assemble document
      const doc = assembleDocument(ctx);

      // Compute score
      const { violations: docViolations } = validateDocument(doc);
      const score = computeScore(doc, docViolations.map(v => v.ruleName));
      doc.prediiScore = score;

      // Base assembled text
      const baseComplaint  = doc.sections?.complaint?.text  || selectedRO.concern || complaint || "";
      const baseCause      = doc.sections?.cause?.text      || cause      || "";
      const baseCorrection = doc.sections?.correction?.text || correction || "";

      // Apply generation mode via LLM service
      const narrative = await generateNarrative(generationMode, {
        complaint:   baseComplaint,
        cause:       baseCause,
        correction:  baseCorrection,
        vehicle,
        roId:        selectedRO.id,
        dviFindings: ctx.dviFindings  || [],
        tsbMatches:  ctx.tsbMatches   || [],
        dtcCodes:    ctx.dtcCodes     || [],
        techNotes,
      });

      setComplaint(narrative.complaint);
      setCause(narrative.cause);
      setCorrection(narrative.correction);
      if (narrative.fallback && narrative.error) setLlmError(`AI Rewrite fell back to local (${narrative.error}). Check browser console.`);
      else if (narrative.fallback) setLlmError("No API key — showing local rewrite. Set VITE_ANTHROPIC_API_KEY to enable AI.");
      else if (narrative.usedLLM) setLlmError(null); // clear any prior error on success
      setPrediiScore(score);

      // Attach bay assignment so customer document can show vehicle status
      if (bayAssignment != null) {
        const bay = SHOP_BAYS.find(b => b.id === bayAssignment);
        doc.bayAssignment = {
          bayId: bay.id,
          bayName: bay.name,
          tech: bay.tech,
          vehicleStatus: bay.status,
          estReady: bay.estFree,
        };
      }

      // Store assembled doc for review
      setAssembledDoc(doc);
      setViolations(docViolations);

      setGenerating(false);
      setBuilding(false);
      setGenerated(true);
    } catch (err) {
      console.error("Generation error:", err);
      setLlmError(`Error: ${err.message || "Unknown error"} — check browser console for details.`);
      setGenerating(false);
      setBuilding(false);
    }
  }

  function handleReset() {
    setComplaint("");
    setCause("");
    setCorrection("");
    setTechNotes("");
    setGenerated(false);
    setRecalls([]);
    setRecallChecked(false);
    setRecallError(null);
    setROContext(null);
    setPrediiScore(null);
    setAssembledDoc(null);
    setViolations([]);
    setBayAssignment(null);
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      minWidth: 0,
    }}>
      <AIInsightsStrip insights={[
        { icon: "📝", text: "David Kim's CR-V: P0420 narrative ready — TSB-19-052 reference improves approval rate 40%", action: "Insert TSB", value: "+40% approval", color: "#2563EB" },
        { icon: "⚠️", text: "Monica's Camry cause section vague — add torque spec and part number for compliance", action: "Enhance Cause", value: "Compliance risk", color: "#F59E0B" },
        { icon: "✅", text: "Last 5 narratives accepted by service manager without edits — AI quality score 96%", value: "96% quality", color: "#22C55E" },
        { icon: "🔍", text: "James Park's BMW: 3 open TSBs match current complaint — review before finalizing", action: "Review TSBs", value: "3 TSB matches", color: "#7C3AED" },
      ]} />
      <div style={{ display: "flex", flex: 1, minWidth: 0, overflow: "hidden" }}>

      {/* ── Left: RO Queue ── */}
      <div style={{
        width: 220, flexShrink: 0,
        background: "#fff",
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "14px 14px 10px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.06, marginBottom: 8 }}>
            Active RO Queue
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#F9FAFB", border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: "5px 8px",
          }}>
            <Search size={11} color={COLORS.textMuted} />
            <input
              value={roSearch}
              onChange={e => setROSearch(e.target.value)}
              placeholder="Search ROs..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 11, flex: 1, color: COLORS.textPrimary }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredROs.map((ro) => {
            const veh = ro.vehicle;
            const selected = ro.id === selectedROId;
            return (
              <div
                key={ro.id}
                onClick={() => setSelectedROId(ro.id)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: selected ? "#FFF7ED" : "transparent",
                  borderLeft: selected ? `3px solid ${COLORS.accent}` : "3px solid transparent",
                  borderBottom: `1px solid ${COLORS.border}`,
                  transition: "background 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: COLORS.primary, fontFamily: "monospace" }}>
                    {ro.id}
                  </span>
                  <StatusBadge status={ro.status} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>
                  {ro.customerName}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>
                  {veh ? `${veh.year} ${veh.make} ${veh.model}` : "—"}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 1.3 }}>
                  {ro.concern.length > 38 ? ro.concern.slice(0, 38) + "..." : ro.concern}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Middle: Narrative Builder ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Demo Mode banner */}
        <div style={{
          background: COLORS.accent,
          padding: "5px 20px",
          fontSize: 11, fontWeight: 700, color: "#fff",
          flexShrink: 0,
          letterSpacing: 0.2,
        }}>
          Demo Mode — All data is simulated
        </div>

        {/* Vehicle header */}
        {vehicle && (
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0a4d5c 100%)`,
            padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Car size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>
                  VIN: {vehicle.vin} &nbsp;·&nbsp; {vehicle.mileage?.toLocaleString()} mi &nbsp;·&nbsp; {selectedRO?.customerName}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* NHTSA Recall check */}
              <button
                onClick={handleCheckRecalls}
                disabled={recallLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 7, border: "none", cursor: recallLoading ? "wait" : "pointer",
                  background: recallChecked ? (recalls.length > 0 ? "#FEF2F2" : "#F0FDF4") : "rgba(255,255,255,0.15)",
                  color: recallChecked ? (recalls.length > 0 ? "#DC2626" : "#16A34A") : "#fff",
                  fontSize: 11, fontWeight: 700,
                  transition: "all 0.15s",
                }}
              >
                <Globe size={12} />
                {recallLoading ? "Checking..." : recallChecked
                  ? (recalls.length > 0 ? `${recalls.length} Recall${recalls.length > 1 ? "s" : ""}` : "No Recalls")
                  : "Check NHTSA"}
              </button>
              {/* RO ID */}
              <div style={{
                padding: "5px 10px", borderRadius: 6,
                background: "rgba(255,255,255,0.12)",
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)",
                fontFamily: "monospace",
              }}>
                {selectedRO?.id}
              </div>
            </div>
          </div>
        )}

        {/* Recall banner */}
        {recallChecked && recalls.length > 0 && (
          <div style={{
            background: "#FEF2F2", borderBottom: "1px solid #FECACA",
            padding: "8px 20px", display: "flex", alignItems: "flex-start", gap: 8, flexShrink: 0,
          }}>
            <AlertCircle size={14} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#991B1B" }}>
              <strong>NHTSA Recall Alert:</strong>{" "}
              {recalls.slice(0, 2).map((r, i) => (
                <span key={i}>
                  Campaign {r.NHTSACampaignNumber} — {r.Component?.split(":")[0]}
                  {i < Math.min(recalls.length, 2) - 1 ? "; " : ""}
                </span>
              ))}
              {recalls.length > 2 && ` +${recalls.length - 2} more`}.
              {" "}Advise customer and document in RO.
            </div>
          </div>
        )}
        {recallError && (
          <div style={{
            background: "#FFFBEB", borderBottom: "1px solid #FDE68A",
            padding: "6px 20px", fontSize: 11, color: "#92400E", flexShrink: 0,
          }}>
            {recallError}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>

          {/* Bay Assignment */}
          <BaySelector selected={bayAssignment} onSelect={setBayAssignment} />

          {/* Tech notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.06, marginBottom: 6 }}>
              Tech Notes / Findings
            </div>
            <textarea
              value={techNotes}
              onChange={e => setTechNotes(e.target.value)}
              placeholder="Enter technician findings, DTC codes, inspection notes..."
              rows={2}
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                padding: "8px 12px", fontSize: 12, lineHeight: 1.5,
                color: COLORS.textPrimary, background: "#F9FAFB",
                resize: "vertical", fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          {/* 7-stage pipeline progress bar */}
          <InlineStagePipeline roContext={roContext} />

          {/* Generation mode selector + Generate button */}
          <div style={{ marginBottom: 18 }}>
            {/* Mode pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginRight: 2 }}>Mode:</span>
              {[
                { key: "short",   label: "Short",          desc: "Concise, 1–2 sentences each" },
                { key: "verbose", label: "Verbose",        desc: "Customer-friendly, plain English" },
                { key: "llm",     label: "✨ AI Rewrite",  desc: "Full LLM rewrite via Claude" },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setGenerationMode(m.key)}
                  title={m.desc}
                  style={{
                    padding: "5px 12px", borderRadius: 16,
                    border: `1.5px solid ${generationMode === m.key ? COLORS.accent : COLORS.border}`,
                    background: generationMode === m.key ? `${COLORS.accent}14` : "#fff",
                    color: generationMode === m.key ? COLORS.accent : COLORS.textSecondary,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {m.label}
                </button>
              ))}
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: "italic", marginLeft: 4 }}>
                {generationMode === "short"   ? "1–2 sentences per section, precise terminology" :
                 generationMode === "verbose" ? "3–5 sentences, customer-friendly language" :
                                               "Full Claude rewrite using all pipeline data"}
              </span>
            </div>

            {llmError && (
              <div style={{ fontSize: 11, color: "#D97706", background: "#FEF3C7", borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>
                ⚠ {llmError}
              </div>
            )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedRO}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 8, border: "none",
                cursor: generating ? "wait" : "pointer",
                background: generating ? "#F3F4F6" : COLORS.accent,
                color: generating ? COLORS.textMuted : "#fff",
                fontSize: 13, fontWeight: 700,
                transition: "all 0.15s",
              }}
            >
              <Sparkles size={14} />
              {generating
                ? `Generating (${generationMode === "llm" ? "AI Rewrite" : generationMode === "verbose" ? "Verbose" : "Short"})…`
                : generated ? "Regenerate" : "Generate 3C Narrative"}
            </button>
            {generated && (
              <button
                onClick={handleReset}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "9px 14px", borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  cursor: "pointer", background: "#fff",
                  color: COLORS.textSecondary, fontSize: 12, fontWeight: 600,
                }}
              >
                <RotateCcw size={12} />
                Clear
              </button>
            )}
            {generated && assembledDoc && onOpenReview && (
              <button
                onClick={() => onOpenReview(assembledDoc, violations)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 8, border: "none",
                  cursor: "pointer",
                  background: COLORS.primary,
                  color: "#fff",
                  fontSize: 12, fontWeight: 700,
                  transition: "all 0.15s",
                }}
              >
                <Send size={13} />
                Review &amp; Send
              </button>
            )}
            {generated && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Predii Score</span>
                <div style={{ width: 120 }}>
                  <ScoreMeter score={displayScore} />
                </div>
              </div>
            )}
          </div>
          </div>

          {/* 3C Blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <NarrativeBlock
              label="Complaint"
              color="#2563EB"
              value={complaint}
              onChange={setComplaint}
              placeholder="Customer states the concern as reported at vehicle drop-off..."
            />
            <NarrativeBlock
              label="Cause"
              color="#D97706"
              value={cause}
              onChange={setCause}
              placeholder="Technician diagnosis: root cause identified during inspection..."
            />
            <NarrativeBlock
              label="Correction"
              color="#16A34A"
              value={correction}
              onChange={setCorrection}
              placeholder="Work performed: services completed, parts replaced, verification steps..."
            />
          </div>
        </div>
      </div>

      {/* ── Right: ROActivePanel ── */}
      <ROActivePanel
        roContext={roContext}
        prediiScore={prediiScore}
        selectedRO={selectedRO}
        complaint={complaint}
        cause={cause}
        correction={correction}
        onOpenFullReview={() => {
          if (onOpenReview && assembledDoc) {
            onOpenReview(assembledDoc, violations);
          }
        }}
        collapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed(!panelCollapsed)}
      />
      </div>
    </div>
  );
}
