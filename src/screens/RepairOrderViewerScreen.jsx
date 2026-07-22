// RepairOrderViewerScreen — RO detail viewer for Surface C (SMS/DMS
// Representative). Layout mirrors AM3CStoryWriterScreen.jsx: a searchable
// queue list on the left, full RO detail on the right. Labor and parts are
// broken out into their own line-item tables (like a real shop invoice),
// editable — adding a line recomputes labor/parts subtotals, tax, and grand
// total live, and persists to the same RepairOrder record via the story-ro
// PATCH endpoint. This is a shop-operations surface: no WrenchIQ-branded
// intelligence renders here — that's exclusively the Surface B sidecar's job.

import { useState, useEffect } from "react";
import { Search, Car, AlertTriangle, FileText, Plus, Wrench, Package } from "lucide-react";
import { COLORS } from "../theme/colors";
import { updateStoryRO } from "../services/repairOrderService";

// Most US states don't tax labor on repair invoices but do tax parts —
// this shop's rate (Bay Area, CA) is applied to the parts subtotal only.
const PARTS_TAX_RATE = 0.0875;

const STATUS_LABEL = {
  in_progress:   "In Progress",
  inspecting:    "Inspecting",
  estimate_sent: "Estimate Sent",
  checked_in:    "Checked In",
  approved:      "Approved",
  closed:        "Complete",
};

const STATUS_STYLE = {
  "In Progress":   { bg: "#DBEAFE", color: "#1D4ED8" },
  "Inspecting":    { bg: "#FEF3C7", color: "#92400E" },
  "Estimate Sent": { bg: "#EDE9FE", color: "#6D28D9" },
  "Checked In":    { bg: "#E0F2FE", color: "#0369A1" },
  "Approved":      { bg: "#DCFCE7", color: "#15803D" },
  "Complete":      { bg: "#DCFCE7", color: "#15803D" },
  "Pending":       { bg: "#F3F4F6", color: "#6B7280" },
};

function StatusBadge({ status }) {
  const label = STATUS_LABEL[status] || "Pending";
  const s = STATUS_STYLE[label] || STATUS_STYLE.Pending;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
      background: s.bg, color: s.color,
      borderRadius: 4, padding: "2px 6px",
    }}>
      {label.toUpperCase()}
    </span>
  );
}

function scoreColor(s) {
  if (s >= 85) return "#16A34A";
  if (s >= 65) return "#D97706";
  return "#DC2626";
}

function fmtMoney(n) {
  if (n == null) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
}

export default function RepairOrderViewerScreen({ ros = [] }) {
  const [search, setSearch]   = useState("");
  const [selectedId, setSelectedId] = useState(ros[0]?.roNumber || ros[0]?.id || null);
  const [serviceLines, setServiceLines] = useState([]);
  const [addingType, setAddingType]     = useState(null); // 'part' | 'labor' | null
  const [lineDesc, setLineDesc]     = useState("");
  const [lineHours, setLineHours]   = useState("");
  const [lineRate, setLineRate]     = useState("");
  const [lineQty, setLineQty]       = useState("1");
  const [lineUnitPrice, setLineUnitPrice] = useState("");
  const [saveState, setSaveState]   = useState(null); // null | 'saving' | 'saved' | 'error'

  const q = search.trim().toLowerCase();
  const filtered = q
    ? ros.filter(ro => {
        const name = ro._customer ? `${ro._customer.firstName} ${ro._customer.lastName}` : "";
        return (ro.roNumber || ro.id || "").toLowerCase().includes(q)
          || name.toLowerCase().includes(q)
          || (ro.customerConcern || "").toLowerCase().includes(q);
      })
    : ros;

  const selected = ros.find(r => (r.roNumber || r.id) === selectedId) || filtered[0] || null;
  const customer = selected?._customer;
  const vehicle  = selected?._vehicle;

  // Reset the editable line list whenever the selected RO changes (new
  // selection, or a fresh poll brought back updated data).
  useEffect(() => {
    setServiceLines(selected?.services || []);
    setAddingType(null);
    setLineDesc(""); setLineHours(""); setLineRate(""); setLineQty("1"); setLineUnitPrice("");
    setSaveState(null);
  }, [selected?.roNumber || selected?.id]);

  // Each repair job keeps its labor and parts together, the way a real RO
  // reads — a job card shows its own labor line plus its own part lines,
  // not one shop-wide labor table separate from one shop-wide parts table.
  const jobGroups = serviceLines.map(s => {
    const hasLabor = (s.laborCost || 0) > 0 || (s.laborHrs || 0) > 0;
    const parts = (s.parts || []).map(p => {
      const qty = p.quantity || 1;
      return { description: p.description, qty, unitPrice: qty ? p.cost / qty : p.cost, total: p.cost };
    });
    const laborTotal = hasLabor ? Math.round(s.laborCost || 0) : 0;
    const partsTotal = parts.reduce((sum, p) => sum + Math.round(p.total), 0);
    return {
      name: s.name,
      labor: hasLabor ? { hours: s.laborHrs || 0, rate: s.laborHrs ? (s.laborCost || 0) / s.laborHrs : null, total: s.laborCost || 0 } : null,
      parts,
      jobTotal: laborTotal + partsTotal,
    };
  });

  const laborSubtotal = jobGroups.reduce((sum, j) => sum + (j.labor ? Math.round(j.labor.total) : 0), 0);
  const partsSubtotal = jobGroups.reduce((sum, j) => sum + j.parts.reduce((s2, p) => s2 + Math.round(p.total), 0), 0);
  const subtotal = laborSubtotal + partsSubtotal;
  const tax      = Math.round(partsSubtotal * PARTS_TAX_RATE);
  const grandTotal = subtotal + tax;

  async function persist(nextLines) {
    if (!selected) return;
    const repairJobs = nextLines.map(s => ({
      description:       s.name,
      laborHours:        s.laborHrs || 0,
      actualLaborHours:  s.actualHrs || 0,
      lineCost:          s.laborCost || 0,
      parts:             (s.parts || []).map(p => ({ description: p.description, lineCost: p.cost, quantity: p.quantity || 1 })),
      status:            s.status || "pending",
      ...(s.clockIn ? { clockIn: s.clockIn } : {}),
    }));
    const newLaborSubtotal = nextLines.reduce((sum, l) => sum + Math.round(l.laborCost || 0), 0);
    const newPartsSubtotal = nextLines.reduce((sum, l) => sum + Math.round((l.parts || []).reduce((s2, p) => s2 + (p.cost || 0), 0)), 0);
    const newTotal = newLaborSubtotal + newPartsSubtotal + Math.round(newPartsSubtotal * PARTS_TAX_RATE);
    setSaveState("saving");
    try {
      await updateStoryRO(selected.roNumber || selected.id, { repairJobs, invoice: newTotal });
      setSaveState("saved");
    } catch (err) {
      console.error("Failed to save RO line:", err);
      setSaveState("error");
    }
  }

  function commitAddLine() {
    let newLine;
    if (addingType === "labor") {
      const hours = parseFloat(lineHours) || 0;
      const rate  = parseFloat(lineRate) || 0;
      if (!lineDesc.trim() || hours <= 0 || rate <= 0) return;
      newLine = { name: lineDesc.trim(), laborHrs: hours, actualHrs: 0, partsCost: 0, parts: [], laborCost: hours * rate, status: "pending", clockIn: null };
    } else {
      const qty  = parseFloat(lineQty) || 0;
      const unit = parseFloat(lineUnitPrice) || 0;
      if (!lineDesc.trim() || qty <= 0 || unit <= 0) return;
      const lineTotal = qty * unit;
      newLine = { name: lineDesc.trim(), laborHrs: 0, actualHrs: 0, partsCost: lineTotal, parts: [{ description: lineDesc.trim(), cost: lineTotal, quantity: qty }], laborCost: 0, status: "pending", clockIn: null };
    }

    const nextLines = [...serviceLines, newLine];
    setServiceLines(nextLines);
    persist(nextLines);
    setAddingType(null);
    setLineDesc(""); setLineHours(""); setLineRate(""); setLineQty("1"); setLineUnitPrice("");
  }

  if (!ros.length) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", gap: 10, padding: "48px 16px", textAlign: "center",
      }}>
        <AlertTriangle size={18} color={COLORS.textMuted} />
        <span style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>
          Data feed unavailable — no repair orders to display.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", height: "100%", minWidth: 0, overflow: "hidden",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* ── Left: RO Queue ── */}
      <div style={{
        width: 220, flexShrink: 0,
        background: "#fff",
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.06, marginBottom: 8 }}>
            Repair Order Queue
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#F9FAFB", border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: "5px 8px",
          }}>
            <Search size={11} color={COLORS.textMuted} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customer, RO#, concern..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 11, flex: 1, color: COLORS.textPrimary }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((ro) => {
            const id = ro.roNumber || ro.id;
            const veh = ro._vehicle;
            const cust = ro._customer;
            const isSelected = id === (selected?.roNumber || selected?.id);
            return (
              <div
                key={id}
                onClick={() => setSelectedId(id)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: isSelected ? "#FFF7ED" : "transparent",
                  borderLeft: isSelected ? `3px solid ${COLORS.accent}` : "3px solid transparent",
                  borderBottom: `1px solid ${COLORS.border}`,
                  transition: "background 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: COLORS.primary, fontFamily: "monospace" }}>
                    {id}
                  </span>
                  <StatusBadge status={ro.kanbanStatus || ro.status} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>
                  {cust ? `${cust.firstName} ${cust.lastName}` : "—"}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2 }}>
                  {veh ? `${veh.year} ${veh.make} ${veh.model}` : "—"}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 1.3 }}>
                  {(ro.customerConcern || "").length > 38 ? ro.customerConcern.slice(0, 38) + "..." : (ro.customerConcern || "—")}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 16, fontSize: 11, color: COLORS.textMuted, textAlign: "center" }}>
              No ROs match "{search}"
            </div>
          )}
        </div>
      </div>

      {/* ── Right: RO Detail ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {!selected && (
          <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
            Select a repair order from the queue.
          </div>
        )}

        {selected && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Vehicle header */}
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0a4d5c 100%)`,
              padding: "16px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, background: "rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Car size={19} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                    {vehicle?.year} {vehicle?.make} {vehicle?.model} {vehicle?.trim || ""}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                    VIN: {vehicle?.vin || "—"} &nbsp;·&nbsp; {vehicle?.mileage != null ? `${vehicle.mileage.toLocaleString()} mi` : "— mi"} &nbsp;·&nbsp; {customer ? `${customer.firstName} ${customer.lastName}` : "—"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                  {selected.roNumber || selected.id}
                </span>
                <StatusBadge status={selected.kanbanStatus || selected.status} />
              </div>
            </div>

            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Customer Concern */}
              <div>
                <SectionLabel icon={<FileText size={11} color={COLORS.textMuted} />} text="Customer Concern" />
                <div style={{
                  background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary, fontStyle: "italic", lineHeight: 1.5,
                }}>
                  {selected.customerConcern ? `"${selected.customerConcern}"` : "No concern on file."}
                </div>
              </div>

              {/* DTCs */}
              {(selected.dtcs || []).length > 0 && (
                <div>
                  <SectionLabel icon={<AlertTriangle size={11} color={COLORS.textMuted} />} text="Diagnostic Trouble Codes" />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selected.dtcs.map((d, i) => {
                      const code = typeof d === "string" ? d : d.code;
                      const desc = typeof d === "string" ? null : d.description;
                      return (
                        <span key={i} title={desc || ""} style={{
                          fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                          background: "#FEF2F2", color: "#DC2626",
                          borderRadius: 5, padding: "4px 8px",
                        }}>
                          {code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3C Score */}
              {selected.threeCScore != null && (
                <div>
                  <SectionLabel text="3C Compliance Score" />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${selected.threeCScore}%`, height: "100%",
                        background: scoreColor(selected.threeCScore), borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(selected.threeCScore) }}>
                      {selected.threeCScore}/100
                    </span>
                  </div>
                </div>
              )}

              {/* Save state indicator for the whole RO */}
              {saveState && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: saveState === "error" ? "#DC2626" : saveState === "saving" ? COLORS.textMuted : "#16A34A",
                  }}>
                    {saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Saved"}
                  </span>
                </div>
              )}

              {/* Services — each job's labor and parts stay together */}
              <div>
                <SectionLabel icon={<Wrench size={11} color={COLORS.textMuted} />} text={`Services — ${fmtMoney(subtotal)}`} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {jobGroups.map((job, i) => (
                    <div key={i} style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "9px 14px", background: "#F9FAFB", borderBottom: `1px solid ${COLORS.border}`,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{job.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary }}>{fmtMoney(job.jobTotal)}</span>
                      </div>

                      {job.labor && (
                        <div style={{ display: "grid", gridTemplateColumns: "70px 70px 80px 1fr 80px", padding: "8px 14px", alignItems: "center", fontSize: 12 }}>
                          <div style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Labor</div>
                          <div style={{ color: COLORS.textSecondary }}>{job.labor.hours ? `${job.labor.hours.toFixed(1)} hrs` : "—"}</div>
                          <div style={{ color: COLORS.textSecondary }}>{job.labor.rate != null ? fmtMoney(job.labor.rate) + "/hr" : "—"}</div>
                          <div />
                          <div style={{ fontWeight: 700, color: COLORS.textPrimary, textAlign: "right" }}>{fmtMoney(job.labor.total)}</div>
                        </div>
                      )}

                      {job.parts.map((p, pi) => (
                        <div key={pi} style={{
                          display: "grid", gridTemplateColumns: "70px 1fr 50px 90px 80px", padding: "8px 14px", alignItems: "center", fontSize: 12,
                          borderTop: job.labor || pi > 0 ? `1px solid ${COLORS.borderLight || "#F3F4F6"}` : "none",
                        }}>
                          <div style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Part</div>
                          <div style={{ color: COLORS.textPrimary }}>{p.description}</div>
                          <div style={{ color: COLORS.textSecondary }}>{p.qty}</div>
                          <div style={{ color: COLORS.textSecondary }}>{fmtMoney(p.unitPrice)}</div>
                          <div style={{ fontWeight: 700, color: COLORS.textPrimary, textAlign: "right" }}>{fmtMoney(p.total)}</div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {jobGroups.length === 0 && (
                    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>
                      No service lines on this RO.
                    </div>
                  )}

                  {addingType && (
                    <div style={{ background: "#F9FAFB", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                        New {addingType === "labor" ? "Labor" : "Part"} Line
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          autoFocus
                          value={lineDesc}
                          onChange={e => setLineDesc(e.target.value)}
                          placeholder={addingType === "labor" ? "Labor description" : "Part description"}
                          style={inputStyle({ flex: 1 })}
                        />
                        {addingType === "labor" ? (
                          <>
                            <input value={lineHours} onChange={e => setLineHours(e.target.value)} placeholder="Hours" type="number" style={inputStyle({ width: 70 })} />
                            <input value={lineRate} onChange={e => setLineRate(e.target.value)} placeholder="Rate/hr" type="number" style={inputStyle({ width: 80 })} />
                          </>
                        ) : (
                          <>
                            <input value={lineQty} onChange={e => setLineQty(e.target.value)} placeholder="Qty" type="number" style={inputStyle({ width: 56 })} />
                            <input value={lineUnitPrice} onChange={e => setLineUnitPrice(e.target.value)} placeholder="Unit $" type="number" style={inputStyle({ width: 80 })} />
                          </>
                        )}
                      </div>
                      <AddLineActions
                        onCancel={() => setAddingType(null)}
                        onAdd={commitAddLine}
                        disabled={addingType === "labor"
                          ? (!lineDesc.trim() || !(parseFloat(lineHours) > 0) || !(parseFloat(lineRate) > 0))
                          : (!lineDesc.trim() || !(parseFloat(lineQty) > 0) || !(parseFloat(lineUnitPrice) > 0))}
                      />
                    </div>
                  )}
                </div>

                {!addingType && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => setAddingType("labor")} style={addLineButtonStyle}>
                      <Wrench size={11} /> <Plus size={10} /> Labor Line
                    </button>
                    <button onClick={() => setAddingType("part")} style={addLineButtonStyle}>
                      <Package size={11} /> <Plus size={10} /> Part Line
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 16px" }}>
                <TotalRow label="Labor Subtotal" value={laborSubtotal} />
                <TotalRow label="Parts Subtotal" value={partsSubtotal} />
                <TotalRow label="Subtotal" value={subtotal} divider />
                <TotalRow label={`Tax (${(PARTS_TAX_RATE * 100).toFixed(2)}% on parts)`} value={tax} />
                <TotalRow label="Total" value={grandTotal} emphasize divider />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ icon, text, noMargin }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: noMargin ? 0 : 7 }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.06 }}>
        {text}
      </span>
    </div>
  );
}


function AddLineActions({ onCancel, onAdd, disabled }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <button
        onClick={onCancel}
        style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
      >
        Cancel
      </button>
      <button
        onClick={onAdd}
        disabled={disabled}
        style={{
          fontSize: 11, fontWeight: 700, color: "#fff",
          background: disabled ? "#D1D5DB" : COLORS.accent,
          border: "none", borderRadius: 6, padding: "5px 12px",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        Add Line
      </button>
    </div>
  );
}

function TotalRow({ label, value, divider, emphasize }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 0",
      borderTop: divider ? `1px solid ${COLORS.border}` : "none",
      marginTop: divider ? 4 : 0,
    }}>
      <span style={{ fontSize: emphasize ? 13 : 12, fontWeight: emphasize ? 800 : 600, color: emphasize ? COLORS.textPrimary : COLORS.textSecondary }}>
        {label}
      </span>
      <span style={{ fontSize: emphasize ? 15 : 12, fontWeight: 800, color: COLORS.textPrimary }}>
        {fmtMoney(value)}
      </span>
    </div>
  );
}

function inputStyle(extra) {
  return { fontSize: 12, padding: "6px 8px", border: `1px solid ${COLORS.border}`, borderRadius: 6, outline: "none", ...extra };
}

const addLineButtonStyle = {
  display: "flex", alignItems: "center", gap: 5,
  fontSize: 11, fontWeight: 700, color: COLORS.primary,
  background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: "6px 10px", cursor: "pointer",
  marginTop: 8,
};
