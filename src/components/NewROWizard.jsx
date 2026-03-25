import { useState, useEffect, useRef } from "react";
import {
  X, Search, CheckCircle, Plus, Star, Zap, Package,
  Wrench, Sparkles, Trash2, Car, Clock, Shield,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { customers, vehicles, technicians, historicalJobs } from "../data/demoData";

const LABOR_RATE = 195;

// ── Parts lookup ────────────────────────────────────────────
const PARTS = {
  p1:  { id: "p1",  name: "Engine Oil (5W-30, 5qt)",    sku: "MOB-5W30-5",    price: 38 },
  p2:  { id: "p2",  name: "Oil Filter",                  sku: "PH3614",        price: 12 },
  p3:  { id: "p3",  name: "Air Filter",                  sku: "CA10755",       price: 28 },
  p4:  { id: "p4",  name: "Cabin Air Filter",            sku: "CF10285",       price: 25 },
  p5:  { id: "p5",  name: "Serpentine Belt",             sku: "K060885",       price: 58 },
  p6:  { id: "p6",  name: "Brake Pads (Front)",          sku: "D1296-8366",    price: 85 },
  p7:  { id: "p7",  name: "Brake Pads (Rear)",           sku: "D1297-7791",    price: 78 },
  p8:  { id: "p8",  name: "Brake Rotors (Front, ea)",    sku: "BR55078",       price: 95 },
  p9:  { id: "p9",  name: "Coolant (50/50, 1 gal)",      sku: "DEX-COOL-1G",   price: 32 },
  p10: { id: "p10", name: "Transmission Fluid (1 qt)",   sku: "ATF-DX6-1Q",   price: 28 },
  p11: { id: "p11", name: "Wiper Blades (pair)",         sku: "26+18-TRICO",   price: 38 },
  p12: { id: "p12", name: "Spark Plugs (set of 4)",      sku: "NGK-IRIDIUM-4", price: 72 },
  p13: { id: "p13", name: "Tire Rotation",               sku: "SVC-TROT",      price: 25 },
  p15: { id: "p15", name: "Brake Fluid Flush",           sku: "SVC-BF",        price: 89 },
};

// ── Category colors ─────────────────────────────────────────
const CAT = {
  Brakes:      { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  Maintenance: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  Filters:     { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  Fluids:      { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  Belts:       { bg: "#FAF5FF", color: "#7C3AED", border: "#DDD6FE" },
  Ignition:    { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  Engine:      { bg: "#FFF1F2", color: "#BE123C", border: "#FECDD3" },
  Tires:       { bg: "#F0FDFA", color: "#0D9488", border: "#99F6E4" },
  Electrical:  { bg: "#FEF9C3", color: "#A16207", border: "#FDE047" },
};
const catColor = (cat) => CAT[cat] || { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB" };

// ── Symptom → job IDs ───────────────────────────────────────
const SYMPTOM_MAP = [
  { kw: ["check engine", "cel", "engine light", "rough idle", "stall", "misfire", "idle", "rough"], ids: ["job-009"] },
  { kw: ["brake", "squeal", "grinding", "stopping", "brakes", "brake noise", "brake pedal"], ids: ["job-001", "job-002", "job-010"] },
  { kw: ["oil", "oil change", "lube", "full service", "service"], ids: ["job-004"] },
  { kw: ["air filter", "air"], ids: ["job-005"] },
  { kw: ["cabin filter", "cabin", "smell inside", "odor"], ids: ["job-006"] },
  { kw: ["transmission", "shift", "gear", "slipping", "trans", "shudder"], ids: ["job-008"] },
  { kw: ["coolant", "overheat", "overheating", "temp", "temperature", "radiator"], ids: ["job-011"] },
  { kw: ["belt", "serpentine", "belt squeal"], ids: ["job-007"] },
  { kw: ["spark", "ignition", "plug", "misfire"], ids: ["job-009"] },
  { kw: ["wiper", "wipers", "visibility", "blade"], ids: ["job-012"] },
  { kw: ["tire", "rotation", "balance", "tires", "vibration", "vibrate"], ids: ["job-013", "job-017"] },
  { kw: ["alignment", "pulling", "drift"], ids: ["job-017"] },
  { kw: ["battery", "dead", "wont start", "won't start", "no start"], ids: ["job-016"] },
];

function searchJobs(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const matched = new Set();
  for (const entry of SYMPTOM_MAP) {
    if (entry.kw.some(kw => q.includes(kw) || kw.includes(q))) {
      entry.ids.forEach(id => matched.add(id));
    }
  }
  for (const job of historicalJobs) {
    if (job.name.toLowerCase().includes(q) || job.category.toLowerCase().includes(q)) {
      matched.add(job.id);
    }
  }
  return [...matched]
    .map(id => historicalJobs.find(j => j.id === id))
    .filter(Boolean)
    .slice(0, 6);
}

function getPartsForJob(job) {
  return (job.suggestedParts || []).map(pid => PARTS[pid]).filter(Boolean);
}

// ── Sample plate hints ──────────────────────────────────────
const SAMPLE_PLATES = [
  { plate: "8ABC123", hint: "Monica · 2021 Camry" },
  { plate: "7XYZ456", hint: "Robert · 2022 F-150" },
  { plate: "6DEF789", hint: "David · 2019 CR-V" },
  { plate: "9GHI012", hint: "James · 2020 BMW X3" },
];

// ── RO Tracker steps ────────────────────────────────────────
const STEPS = [
  { id: "checked_in",  label: "Checked In"       },
  { id: "estimate",    label: "Estimate Ready"    },
  { id: "approved",    label: "Approved"          },
  { id: "in_progress", label: "In Progress"       },
  { id: "ready",       label: "Ready for Pickup"  },
];
const STEP_IDX = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));

function todayAt(offsetHours) {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + offsetHours);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ── Main Component ──────────────────────────────────────────
export default function NewROWizard({ onClose }) {
  const [plateInput, setPlateInput]     = useState("");
  const [customer, setCustomer]         = useState(null);
  const [vehicle, setVehicle]           = useState(null);
  const [symptomInput, setSymptomInput] = useState("");
  const [suggestions, setSuggestions]   = useState([]);
  const [showDrop, setShowDrop]         = useState(false);
  const [addedJobs, setAddedJobs]       = useState([]);
  const [roStatus, setRoStatus]         = useState("estimate");
  const symptomRef = useRef(null);
  const dropRef    = useRef(null);

  // Plate → customer / vehicle
  useEffect(() => {
    const q = plateInput.toUpperCase().replace(/\s/g, "");
    if (q.length >= 4) {
      const v = vehicles.find(v2 => v2.licensePlate?.replace(/\s/g, "").toUpperCase() === q);
      if (v) {
        setVehicle(v);
        setCustomer(customers.find(c => c.id === v.customerId) || null);
        return;
      }
    }
    setVehicle(null);
    setCustomer(null);
  }, [plateInput]);

  // Symptom search
  useEffect(() => {
    const results = searchJobs(symptomInput).filter(j => !addedJobs.find(aj => aj.id === j.id));
    setSuggestions(results);
    setShowDrop(results.length > 0 && symptomInput.length >= 2);
  }, [symptomInput, addedJobs]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          symptomRef.current && !symptomRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function addJob(job) {
    setAddedJobs(prev => [...prev, { ...job, parts: getPartsForJob(job) }]);
    setSymptomInput("");
    setShowDrop(false);
  }
  function removeJob(id) {
    setAddedJobs(prev => prev.filter(j => j.id !== id));
  }
  function addRelated(jobId) {
    const job = historicalJobs.find(j => j.id === jobId);
    if (job && !addedJobs.find(j => j.id === jobId)) addJob(job);
  }

  // Totals
  const laborTotal = addedJobs.reduce((s, j) => s + Math.round(j.avgLaborHrs * LABOR_RATE), 0);
  const partsTotal = addedJobs.reduce((s, j) => s + j.parts.reduce((ps, p) => ps + p.price, 0), 0);
  const grandTotal = laborTotal + partsTotal;
  const totalHours = addedJobs.reduce((s, j) => s + j.avgLaborHrs, 0);

  // Recommended tech (match make or default)
  const tech = technicians.find(t =>
    vehicle && t.specialty.toLowerCase().includes(vehicle.make.toLowerCase())
  ) || technicians[0];

  const hasJobs = addedJobs.length > 0;
  const stepIdx = STEP_IDX[roStatus] ?? 1;

  // Unique related jobs not yet added
  const relatedChips = addedJobs
    .flatMap(j => (j.relatedJobs || []).filter(rj => !addedJobs.find(aj => aj.id === rj.jobId)))
    .filter((rj, i, arr) => arr.findIndex(r => r.jobId === rj.jobId) === i)
    .slice(0, 4);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        width: hasJobs ? 980 : 580,
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 26px 0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1.2 }}>
                Intelligent RO
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Peninsula Precision Auto · Powered by PrediiAgent
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, background: "#F3F4F6",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} color={COLORS.textSecondary} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "22px 26px 26px",
          display: "flex", gap: 22,
        }}>

          {/* ── LEFT ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

            {/* License Plate */}
            <div style={{ marginBottom: vehicle ? 16 : 20 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#F9FAFB",
                border: `2px solid ${vehicle ? COLORS.accent : "#E5E7EB"}`,
                borderRadius: 14, padding: "13px 18px",
                transition: "border-color 0.2s",
              }}>
                <Car size={17} color={vehicle ? COLORS.accent : COLORS.textMuted} />
                <input
                  autoFocus
                  value={plateInput}
                  onChange={e => setPlateInput(e.target.value.toUpperCase())}
                  placeholder="Enter license plate…"
                  style={{
                    border: "none", outline: "none", background: "transparent",
                    fontSize: 20, fontWeight: 800, letterSpacing: 3,
                    flex: 1, fontFamily: "monospace", color: COLORS.textPrimary,
                    textTransform: "uppercase",
                  }}
                />
                {vehicle && <CheckCircle size={20} color={COLORS.accent} />}
              </div>

              {/* Sample plates */}
              {!vehicle && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted, marginRight: 2, alignSelf: "center" }}>Try:</span>
                  {SAMPLE_PLATES.map(sp => (
                    <button
                      key={sp.plate}
                      onClick={() => setPlateInput(sp.plate)}
                      style={{
                        padding: "4px 11px", borderRadius: 7,
                        background: "#F3F4F6", border: "1px solid #E5E7EB",
                        fontSize: 11, cursor: "pointer",
                        fontWeight: 700, color: COLORS.textSecondary,
                        display: "flex", alignItems: "center", gap: 5,
                        letterSpacing: 0.5,
                      }}
                    >
                      <span style={{ color: COLORS.textPrimary, fontFamily: "monospace" }}>{sp.plate}</span>
                      <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>· {sp.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Card */}
            {vehicle && customer && (
              <div style={{
                background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.accent}05)`,
                border: `1.5px solid ${COLORS.accent}30`,
                borderRadius: 14, padding: "14px 18px",
                marginBottom: 16,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 23,
                  background: COLORS.primary, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, flexShrink: 0,
                }}>
                  {customer.firstName[0]}{customer.lastName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary }}>
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginTop: 1 }}>
                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{vehicle.engine}</span>
                    <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{vehicle.mileage?.toLocaleString()} mi</span>
                    <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>Last: {vehicle.lastService}</span>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 800, color: COLORS.accent,
                  background: "#FFF7ED", border: `1px solid ${COLORS.accent}40`,
                  borderRadius: 7, padding: "4px 10px", flexShrink: 0,
                  fontFamily: "monospace", letterSpacing: 1,
                }}>
                  {vehicle.licensePlate}
                </div>
              </div>
            )}

            {/* Symptom / Job Search */}
            {vehicle && (
              <div style={{ position: "relative", marginBottom: hasJobs ? 18 : 0 }}>
                <div
                  ref={symptomRef}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#F9FAFB",
                    border: `2px solid ${showDrop ? COLORS.accent : "#E5E7EB"}`,
                    borderRadius: 12, padding: "11px 16px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <Search size={15} color={COLORS.textMuted} />
                  <input
                    autoFocus={!!vehicle}
                    value={symptomInput}
                    onChange={e => setSymptomInput(e.target.value)}
                    onFocus={() => suggestions.length && setShowDrop(true)}
                    placeholder="Describe symptom or job… e.g. rough idle, brake squeal, oil change"
                    style={{
                      border: "none", outline: "none", background: "transparent",
                      fontSize: 14, flex: 1, color: COLORS.textPrimary,
                    }}
                  />
                  {symptomInput && (
                    <button
                      onClick={() => { setSymptomInput(""); setShowDrop(false); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: COLORS.textMuted }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showDrop && (
                  <div
                    ref={dropRef}
                    style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: "#fff", borderRadius: 12, zIndex: 100,
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.13)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{
                      padding: "6px 14px", fontSize: 10, fontWeight: 700,
                      color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5,
                      borderBottom: "1px solid #F3F4F6", background: "#FAFAFA",
                    }}>
                      Matched Jobs — {suggestions.length} found
                    </div>
                    {suggestions.map(job => {
                      const cc = catColor(job.category);
                      return (
                        <div
                          key={job.id}
                          onClick={() => addJob(job)}
                          style={{
                            padding: "10px 14px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 10,
                            borderBottom: "1px solid #F9FAFB",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{job.name}</span>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`,
                              }}>{job.category}</span>
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                              {job.avgLaborHrs}h · ${job.avgTotal} avg · {job.frequency}× at this shop
                            </div>
                          </div>
                          <div style={{
                            width: 26, height: 26, borderRadius: 7,
                            background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <Plus size={13} color="#fff" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {vehicle && !hasJobs && (
              <div style={{
                textAlign: "center", padding: "40px 20px", color: COLORS.textMuted,
                marginTop: 20,
              }}>
                <Search size={32} color="#E5E7EB" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>Describe the symptom or search for a job above</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>e.g. "rough idle", "brake squeal", "oil change"</div>
              </div>
            )}

            {/* ── Estimate / Job List ── */}
            {hasJobs && (
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
                  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12,
                }}>
                  Estimate — {addedJobs.length} Job{addedJobs.length !== 1 ? "s" : ""}
                </div>

                {addedJobs.map(job => {
                  const cc = catColor(job.category);
                  const jobLabor = Math.round(job.avgLaborHrs * LABOR_RATE);
                  const jobParts = job.parts.reduce((s, p) => s + p.price, 0);
                  return (
                    <div key={job.id} style={{
                      border: "1.5px solid #E5E7EB", borderRadius: 12,
                      marginBottom: 10, overflow: "hidden",
                    }}>
                      {/* Job header row */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "11px 14px",
                        background: "#FAFAFA",
                        borderBottom: job.parts.length > 0 ? "1px solid #F3F4F6" : "none",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{job.name}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                              background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`,
                            }}>{job.category}</span>
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                            {job.avgLaborHrs}h × ${LABOR_RATE}/hr
                            <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}> = ${jobLabor} labor</span>
                            {jobParts > 0 && (
                              <span style={{ color: COLORS.textSecondary }}> · ${jobParts} parts</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.accent }}>${jobLabor + jobParts}</div>
                          <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase" }}>total</div>
                        </div>
                        <button
                          onClick={() => removeJob(job.id)}
                          style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: "1px solid #FEE2E2", background: "#FEF2F2",
                            cursor: "pointer", color: "#DC2626",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Parts rows */}
                      {job.parts.length > 0 && (
                        <div style={{ padding: "8px 14px 10px" }}>
                          {job.parts.map(p => (
                            <div key={p.id} style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center", padding: "4px 0",
                              fontSize: 12, borderBottom: "1px dotted #F3F4F6",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Package size={11} color={COLORS.textMuted} />
                                <span style={{ color: COLORS.textSecondary }}>{p.name}</span>
                                <span style={{ fontSize: 10, color: "#C4C4C4", fontFamily: "monospace" }}>#{p.sku}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>${p.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Related jobs chips */}
                {relatedChips.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: COLORS.textMuted,
                      textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Sparkles size={10} color={COLORS.accent} /> Frequently added together
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {relatedChips.map(rj => (
                        <button
                          key={rj.jobId}
                          onClick={() => addRelated(rj.jobId)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 11px", borderRadius: 8,
                            background: "#FFF7ED", border: `1px solid ${COLORS.accent}40`,
                            fontSize: 12, fontWeight: 600, color: COLORS.textPrimary,
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={11} color={COLORS.accent} />
                          {rj.name}
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            background: "#FFEDD5", color: COLORS.accent,
                            borderRadius: 4, padding: "0 5px",
                          }}>{rj.pct}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grand total */}
                <div style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}06, ${COLORS.accent}04)`,
                  border: `1.5px solid ${COLORS.accent}30`,
                  borderRadius: 12, padding: "14px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>
                      Labor ${laborTotal} + Parts ${partsTotal}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {totalHours.toFixed(1)} hrs total · {addedJobs.length} line items
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Estimate</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.accent, lineHeight: 1.1 }}>
                      ${grandTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Tracker + Tech ── */}
          {hasJobs && (
            <div style={{ width: 290, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* RO Status Tracker */}
              <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>

                {/* Tracker header */}
                <div style={{
                  background: COLORS.primary, padding: "12px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>RO Tracker</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    background: roStatus === "ready" ? "#16A34A" : COLORS.accent,
                    color: "#fff", borderRadius: 5, padding: "2px 8px",
                    letterSpacing: 0.5,
                  }}>
                    {roStatus === "estimate" ? "PENDING" :
                     roStatus === "approved" ? "APPROVED" :
                     roStatus === "in_progress" ? "IN SHOP" : "READY"}
                  </span>
                </div>

                {/* Timeline */}
                <div style={{ padding: "16px 16px 10px" }}>
                  {STEPS.map((step, i) => {
                    const done   = i < stepIdx;
                    const active = i === stepIdx;
                    return (
                      <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        {/* Dot + line */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 12,
                            background: done ? "#16A34A" : active ? COLORS.accent : "#F3F4F6",
                            border: `2px solid ${done ? "#16A34A" : active ? COLORS.accent : "#D1D5DB"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: active ? `0 0 0 4px ${COLORS.accent}18` : "none",
                            transition: "all 0.3s",
                          }}>
                            {done  && <CheckCircle size={13} color="#fff" />}
                            {active && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#fff" }} />}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div style={{
                              width: 2, height: 26,
                              background: done ? "#16A34A" : "#E5E7EB",
                              transition: "background 0.3s",
                            }} />
                          )}
                        </div>
                        {/* Label + time */}
                        <div style={{ paddingTop: 3, paddingBottom: i < STEPS.length - 1 ? 0 : 0, flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: active ? 700 : done ? 600 : 400,
                            color: done ? "#16A34A" : active ? COLORS.textPrimary : COLORS.textMuted,
                            marginBottom: 1,
                          }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: i < STEPS.length - 1 ? 8 : 0 }}>
                            {done ? "Done" :
                             active && step.id === "estimate" ? "Awaiting approval" :
                             active && step.id === "approved" ? todayAt(0) :
                             step.id === "in_progress" ? `~${todayAt(1)}` :
                             step.id === "ready" ? `~${todayAt(4)}` : "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Drop-off / Ready row */}
                <div style={{
                  borderTop: "1px solid #F3F4F6",
                  display: "flex", background: "#FAFAFA",
                }}>
                  <div style={{ flex: 1, padding: "10px 14px", textAlign: "center", borderRight: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>Drop-off</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Now</div>
                  </div>
                  <div style={{ flex: 1, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>Est. Ready</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{todayAt(4)}</div>
                  </div>
                </div>

                {/* Action button area */}
                <div style={{ padding: "12px 14px", borderTop: "1px solid #F3F4F6" }}>
                  {roStatus === "estimate" && (
                    <>
                      <button
                        onClick={() => setRoStatus("approved")}
                        style={{
                          width: "100%", padding: "12px",
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
                          color: "#fff", border: "none", fontWeight: 800, fontSize: 14,
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(255,107,53,0.35)",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        }}
                      >
                        <CheckCircle size={16} /> Approve Estimate
                      </button>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center", marginTop: 7 }}>
                        Sends estimate + 1-tap approval to {customer?.firstName}
                      </div>
                    </>
                  )}
                  {roStatus === "approved" && (
                    <div>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        color: "#16A34A", fontWeight: 700, fontSize: 13, marginBottom: 8,
                      }}>
                        <CheckCircle size={15} /> Approved · RO Created
                      </div>
                      <button
                        onClick={() => setRoStatus("in_progress")}
                        style={{
                          width: "100%", padding: "10px",
                          borderRadius: 9, background: COLORS.primary,
                          color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        }}
                      >
                        Start Work Order →
                      </button>
                    </div>
                  )}
                  {roStatus === "in_progress" && (
                    <button
                      onClick={() => setRoStatus("ready")}
                      style={{
                        width: "100%", padding: "10px",
                        borderRadius: 9, background: "#16A34A",
                        color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                      }}
                    >
                      Mark Ready for Pickup →
                    </button>
                  )}
                  {roStatus === "ready" && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#16A34A", fontWeight: 700, fontSize: 13 }}>Vehicle ready</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
                        Pickup notification sent to {customer?.firstName}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Technician Card ── */}
              {tech && (
                <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{
                    padding: "10px 14px", background: "#F9FAFB",
                    borderBottom: "1px solid #F3F4F6",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <Wrench size={12} color={COLORS.accent} />
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: COLORS.textSecondary,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      Assigned Technician
                    </span>
                  </div>

                  <div style={{ padding: "14px 16px" }}>
                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 22,
                        background: COLORS.primary, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, flexShrink: 0,
                      }}>
                        {tech.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{tech.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{tech.role}</div>
                      </div>
                    </div>

                    {/* Star rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 11 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(i => (
                          <Star
                            key={i} size={14}
                            fill={i <= Math.round(tech.customerRating) ? "#F59E0B" : "none"}
                            color={i <= Math.round(tech.customerRating) ? "#F59E0B" : "#D1D5DB"}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{tech.customerRating}</span>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>customer rating</span>
                    </div>

                    {/* Skill / efficiency bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary }}>Efficiency</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.textPrimary }}>{tech.efficiency}%</span>
                      </div>
                      <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: `${tech.efficiency}%`,
                          background: tech.efficiency >= 90 ? "#16A34A" :
                                      tech.efficiency >= 80 ? COLORS.accent : "#F59E0B",
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>

                    {/* Today's hours */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>Billed Today</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>{tech.hoursToday.billed}h</div>
                      </div>
                      <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>Available</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#16A34A" }}>
                          {(tech.hoursToday.available - tech.hoursToday.billed).toFixed(1)}h
                        </div>
                      </div>
                    </div>

                    {/* Specialty */}
                    <div style={{ marginBottom: 9 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                        background: `${COLORS.primary}12`, color: COLORS.primary,
                        border: `1px solid ${COLORS.primary}20`,
                      }}>
                        {tech.specialty}
                      </span>
                    </div>

                    {/* Cert badges */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {tech.certs.map((cert, i) => (
                        <span key={i} style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: "#EFF6FF", color: "#2563EB",
                          border: "1px solid #BFDBFE",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          <Shield size={8} />
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
