import { useState } from "react";
import {
  X, Camera, CheckCircle, Circle, ChevronRight, Plus, Minus,
  Search, Wrench, Package, FileText, User, Car, Zap,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { customers, vehicles, technicians, getVehicle } from "../data/demoData";

// ── Parts catalog (quick-add library) ─────────────────────
const PARTS_CATALOG = [
  { id: "p1",  name: "Engine Oil (5W-30, 5qt)",     sku: "MOB-5W30-5",   cost: 18,  price: 38,  category: "fluid" },
  { id: "p2",  name: "Oil Filter",                  sku: "PH3614",       cost: 4,   price: 12,  category: "filter" },
  { id: "p3",  name: "Air Filter",                  sku: "CA10755",      cost: 11,  price: 28,  category: "filter" },
  { id: "p4",  name: "Cabin Air Filter",             sku: "CF10285",      cost: 9,   price: 25,  category: "filter" },
  { id: "p5",  name: "Serpentine Belt",              sku: "K060885",      cost: 22,  price: 58,  category: "belt" },
  { id: "p6",  name: "Brake Pads (Front)",           sku: "D1296-8366",   cost: 38,  price: 85,  category: "brake" },
  { id: "p7",  name: "Brake Pads (Rear)",            sku: "D1297-7791",   cost: 34,  price: 78,  category: "brake" },
  { id: "p8",  name: "Brake Rotors (Front, each)",   sku: "BR55078",      cost: 45,  price: 95,  category: "brake" },
  { id: "p9",  name: "Coolant (50/50 premix, 1gal)", sku: "DEX-COOL-1G",  cost: 14,  price: 32,  category: "fluid" },
  { id: "p10", name: "Transmission Fluid (1qt)",     sku: "ATF-DX6-1Q",   cost: 12,  price: 28,  category: "fluid" },
  { id: "p11", name: "Wiper Blades (pair)",          sku: "26+18-TRICO",  cost: 16,  price: 38,  category: "wiper" },
  { id: "p12", name: "Spark Plugs (set of 4)",       sku: "NGK-IRIDIUM-4",cost: 32,  price: 72,  category: "ignition" },
  { id: "p13", name: "Tire Rotation (labor)",        sku: "SVC-TROT",     cost: 0,   price: 25,  category: "labor" },
  { id: "p14", name: "Multi-Point Inspection (labor)",sku: "SVC-MPI",     cost: 0,   price: 45,  category: "labor" },
  { id: "p15", name: "Brake Fluid Flush (labor+fluid)",sku: "SVC-BF",     cost: 12,  price: 89,  category: "fluid" },
];

const CATEGORY_LABELS = {
  fluid: "Fluids",  filter: "Filters",  brake: "Brakes",
  belt: "Belts",    wiper: "Wipers",    ignition: "Ignition",
  labor: "Labor",
};

// ── Inspection items ───────────────────────────────────────
const INSPECTION_ITEMS = [
  { id: "i1",  group: "Fluids",    label: "Engine Oil",          default: "ok" },
  { id: "i2",  group: "Fluids",    label: "Coolant Level",       default: "ok" },
  { id: "i3",  group: "Fluids",    label: "Brake Fluid",         default: "ok" },
  { id: "i4",  group: "Fluids",    label: "Transmission Fluid",  default: "ok" },
  { id: "i5",  group: "Filters",   label: "Air Filter",          default: "advisory" },
  { id: "i6",  group: "Filters",   label: "Cabin Air Filter",    default: "ok" },
  { id: "i7",  group: "Brakes",    label: "Front Brake Pads",    default: "advisory" },
  { id: "i8",  group: "Brakes",    label: "Rear Brake Pads",     default: "ok" },
  { id: "i9",  group: "Brakes",    label: "Brake Rotors",        default: "ok" },
  { id: "i10", group: "Tires",     label: "Tire Tread Depth",    default: "ok" },
  { id: "i11", group: "Tires",     label: "Tire Pressure",       default: "ok" },
  { id: "i12", group: "Belts",     label: "Serpentine Belt",     default: "urgent" },
  { id: "i13", group: "Lights",    label: "All Exterior Lights", default: "ok" },
  { id: "i14", group: "Wipers",    label: "Wiper Blades",        default: "advisory" },
];

const STATUS_CONFIG = {
  ok:       { label: "OK",       color: "#16A34A", bg: "#F0FDF4", border: "#22C55E" },
  advisory: { label: "Advisory", color: "#D97706", bg: "#FFFBEB", border: "#F59E0B" },
  urgent:   { label: "Urgent",   color: "#DC2626", bg: "#FEF2F2", border: "#EF4444" },
};

// ── Part suggestion mapping from inspection ────────────────
const INSPECTION_PART_SUGGESTIONS = {
  i5:  ["p3"],   // Air Filter → Air Filter part
  i6:  ["p4"],   // Cabin Filter → Cabin Air Filter
  i7:  ["p6"],   // Front Pads → Brake Pads Front
  i8:  ["p7"],   // Rear Pads → Brake Pads Rear
  i9:  ["p8"],   // Rotors → Brake Rotors
  i12: ["p5"],   // Serpentine Belt → Serpentine Belt
  i14: ["p11"],  // Wiper Blades → Wiper Blades
};

// ── STEP INDICATOR ─────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ["Customer", "Inspect", "Estimate", "Create RO"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: done ? COLORS.success : active ? COLORS.accent : "#E5E7EB",
                color: done || active ? "#fff" : COLORS.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
              }}>
                {done ? <CheckCircle size={14} /> : idx}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? COLORS.textPrimary : COLORS.textMuted, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? COLORS.success : "#E5E7EB", margin: "0 4px", marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── STEP 1: Customer + Vehicle ─────────────────────────────
function StepCustomer({ data, setData, onNext }) {
  const [custSearch, setCustSearch] = useState("");
  const filtered = customers.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone?.includes(custSearch)
  );
  const custVehicles = data.customerId
    ? vehicles.filter(v => v.customerId === data.customerId)
    : [];

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: COLORS.textPrimary }}>Who's coming in?</h3>

      {/* Customer search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
        <Search size={14} color={COLORS.textMuted} />
        <input
          autoFocus
          value={custSearch}
          onChange={e => setCustSearch(e.target.value)}
          placeholder="Search customer name or phone…"
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
        {filtered.map(c => (
          <div
            key={c.id}
            onClick={() => setData(d => ({ ...d, customerId: c.id, vehicleId: null }))}
            style={{
              padding: "10px 12px", borderRadius: 8, cursor: "pointer",
              border: `1.5px solid ${data.customerId === c.id ? COLORS.accent : "#E5E7EB"}`,
              background: data.customerId === c.id ? "#FFF7ED" : "#fff",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 16, background: COLORS.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {c.firstName[0]}{c.lastName[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{c.phone} · {c.email}</div>
            </div>
            {data.customerId === c.id && <CheckCircle size={16} color={COLORS.accent} style={{ marginLeft: "auto" }} />}
          </div>
        ))}
      </div>

      {/* Vehicle picker */}
      {custVehicles.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>Select vehicle</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {custVehicles.map(v => (
              <div
                key={v.id}
                onClick={() => setData(d => ({ ...d, vehicleId: v.id }))}
                style={{
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${data.vehicleId === v.id ? COLORS.accent : "#E5E7EB"}`,
                  background: data.vehicleId === v.id ? "#FFF7ED" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Car size={16} color={data.vehicleId === v.id ? COLORS.accent : COLORS.textMuted} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.year} {v.make} {v.model}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "monospace" }}>···{v.vin?.slice(-6)} · {v.mileage?.toLocaleString()} mi</div>
                  </div>
                </div>
                {data.vehicleId === v.id && <CheckCircle size={16} color={COLORS.accent} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!data.customerId || !data.vehicleId}
        style={{
          marginTop: 20, width: "100%", padding: "12px", borderRadius: 10,
          background: data.customerId && data.vehicleId ? COLORS.accent : "#E5E7EB",
          color: data.customerId && data.vehicleId ? "#fff" : COLORS.textMuted,
          border: "none", fontWeight: 700, fontSize: 14, cursor: data.customerId && data.vehicleId ? "pointer" : "not-allowed",
        }}
      >
        Next: Inspection →
      </button>
    </div>
  );
}

// ── STEP 2: Quick Inspection ───────────────────────────────
function StepInspect({ data, setData, onNext, onBack }) {
  const [statuses, setStatuses] = useState(() => {
    const s = {};
    INSPECTION_ITEMS.forEach(it => { s[it.id] = it.default; });
    return s;
  });

  const groups = [...new Set(INSPECTION_ITEMS.map(i => i.group))];
  const urgent = INSPECTION_ITEMS.filter(i => statuses[i.id] === "urgent").length;
  const advisory = INSPECTION_ITEMS.filter(i => statuses[i.id] === "advisory").length;

  function handleNext() {
    // Auto-suggest parts for non-OK items
    const suggested = [];
    INSPECTION_ITEMS.forEach(it => {
      if (statuses[it.id] !== "ok" && INSPECTION_PART_SUGGESTIONS[it.id]) {
        INSPECTION_PART_SUGGESTIONS[it.id].forEach(pid => {
          const part = PARTS_CATALOG.find(p => p.id === pid);
          if (part && !suggested.find(s => s.id === pid)) {
            suggested.push({ ...part, qty: 1 });
          }
        });
      }
    });
    // Always include oil change as base
    const oilParts = ["p1", "p2"].map(pid => ({ ...PARTS_CATALOG.find(p => p.id === pid), qty: 1 }));
    const allParts = [...oilParts];
    suggested.forEach(p => { if (!allParts.find(a => a.id === p.id)) allParts.push(p); });
    setData(d => ({ ...d, inspectionStatuses: statuses, parts: allParts }));
    onNext();
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: COLORS.textPrimary }}>Quick Inspection</h3>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>
        Tap each item to cycle: OK → Advisory → Urgent
        {(urgent > 0 || advisory > 0) && (
          <span style={{ marginLeft: 8 }}>
            {urgent > 0 && <span style={{ color: "#DC2626", fontWeight: 700 }}>{urgent} urgent </span>}
            {advisory > 0 && <span style={{ color: "#D97706", fontWeight: 700 }}>{advisory} advisory</span>}
          </span>
        )}
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto", marginBottom: 16 }}>
        {groups.map(group => (
          <div key={group} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {INSPECTION_ITEMS.filter(i => i.group === group).map(item => {
                const s = statuses[item.id];
                const cfg = STATUS_CONFIG[s];
                const cycle = { ok: "advisory", advisory: "urgent", urgent: "ok" };
                return (
                  <div
                    key={item.id}
                    onClick={() => setStatuses(prev => ({ ...prev, [item.id]: cycle[prev[item.id]] }))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                      background: cfg.bg, border: `1px solid ${cfg.border}20`,
                    }}
                  >
                    <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.label}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: cfg.color,
                      background: "#fff", borderRadius: 5, padding: "2px 8px",
                      border: `1px solid ${cfg.border}40`,
                    }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#F3F4F6", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", color: COLORS.textSecondary }}>← Back</button>
        <button onClick={handleNext} style={{ flex: 3, padding: "11px", borderRadius: 10, background: COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Build Estimate → {urgent + advisory > 0 && `(${urgent + advisory} items found)`}
        </button>
      </div>
    </div>
  );
}

// ── STEP 3: Estimate Builder ───────────────────────────────
function StepEstimate({ data, setData, onNext, onBack }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const parts = data.parts || [];

  const categories = ["all", ...new Set(PARTS_CATALOG.map(p => p.category))];
  const filtered = PARTS_CATALOG.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function addPart(part) {
    setData(d => {
      const existing = d.parts.find(p => p.id === part.id);
      if (existing) return { ...d, parts: d.parts.map(p => p.id === part.id ? { ...p, qty: p.qty + 1 } : p) };
      return { ...d, parts: [...d.parts, { ...part, qty: 1 }] };
    });
  }
  function removePart(partId) {
    setData(d => ({ ...d, parts: d.parts.filter(p => p.id !== partId) }));
  }
  function changeQty(partId, delta) {
    setData(d => ({
      ...d,
      parts: d.parts.map(p => p.id === partId
        ? { ...p, qty: Math.max(1, p.qty + delta) }
        : p
      ),
    }));
  }

  const subtotal = parts.reduce((sum, p) => sum + p.price * p.qty, 0);
  const laborRate = 195;
  const estimatedHours = Math.max(1, parts.filter(p => p.category !== "labor").length * 0.4 + 0.5);
  const laborTotal = Math.round(estimatedHours * laborRate);
  const total = subtotal + laborTotal;

  const isInCart = id => parts.some(p => p.id === id);

  return (
    <div style={{ display: "flex", gap: 16, height: "100%" }}>
      {/* Left: parts catalog */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Add Parts & Services</h3>

        {/* Search + category filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 10px", marginBottom: 8 }}>
          <Search size={13} color={COLORS.textMuted} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, cursor: "pointer",
              background: activeCategory === cat ? COLORS.primary : "#F3F4F6",
              color: activeCategory === cat ? "#fff" : COLORS.textSecondary,
              border: "none", textTransform: "capitalize",
            }}>{cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
          {filtered.map(part => (
            <div key={part.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", borderRadius: 8, cursor: "pointer",
              background: isInCart(part.id) ? "#FFF7ED" : "#fff",
              border: `1px solid ${isInCart(part.id) ? COLORS.accent + "60" : "#E5E7EB"}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>{part.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>#{part.sku}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent }}>${part.price}</span>
                <button
                  onClick={() => isInCart(part.id) ? removePart(part.id) : addPart(part)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: "none", cursor: "pointer",
                    background: isInCart(part.id) ? "#FEE2E2" : COLORS.accent,
                    color: isInCart(part.id) ? "#DC2626" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {isInCart(part.id) ? <Minus size={12} /> : <Plus size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: estimate summary */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Estimate</h3>

        {parts.length === 0 ? (
          <div style={{ color: COLORS.textMuted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>No parts added yet</div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
            {parts.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.3 }}>{p.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => changeQty(p.id, -1)} style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={9} /></button>
                  <span style={{ fontSize: 11, fontWeight: 600, minWidth: 14, textAlign: "center" }}>{p.qty}</span>
                  <button onClick={() => changeQty(p.id, 1)} style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={9} /></button>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, minWidth: 36, textAlign: "right" }}>${p.price * p.qty}</span>
                  <button onClick={() => removePart(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, padding: 0 }}><X size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 10, marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
            <span>Parts subtotal</span><span>${subtotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>
            <span>Labor est. ({estimatedHours.toFixed(1)}h × $195)</span><span>${laborTotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 12 }}>
            <span>Total</span><span style={{ color: COLORS.accent }}>${total}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onBack} style={{ flex: 1, padding: "9px", borderRadius: 8, background: "#F3F4F6", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer", color: COLORS.textSecondary }}>← Back</button>
            <button
              onClick={() => { setData(d => ({ ...d, total, laborTotal, subtotal })); onNext(); }}
              disabled={parts.length === 0}
              style={{ flex: 2, padding: "9px", borderRadius: 8, background: parts.length > 0 ? COLORS.accent : "#E5E7EB", color: parts.length > 0 ? "#fff" : COLORS.textMuted, border: "none", fontWeight: 700, fontSize: 12, cursor: parts.length > 0 ? "pointer" : "not-allowed" }}
            >
              Create RO →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STEP 4: Confirm & Create RO ───────────────────────────
function StepConfirm({ data, onClose }) {
  const customer = customers.find(c => c.id === data.customerId);
  const vehicle = vehicles.find(v => v.id === data.vehicleId);
  const [techId, setTechId] = useState(technicians[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState(false);

  const newROId = `RO-2024-${1195 + Math.floor(Math.random() * 10)}`;

  if (created) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "#F0FDF4", border: "2px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#16A34A" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 6 }}>Repair Order Created</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 4 }}>{newROId}</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 }}>
          {customer?.firstName} {customer?.lastName} · {vehicle?.year} {vehicle?.make} {vehicle?.model}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginBottom: 24 }}>
          Estimate: ${data.total?.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, background: COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            View in Repair Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: COLORS.textPrimary }}>Confirm & Create RO</h3>

      {/* Summary card */}
      <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{customer?.firstName} {customer?.lastName}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{vehicle?.year} {vehicle?.make} {vehicle?.model}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>···{vehicle?.vin?.slice(-6)} · {vehicle?.mileage?.toLocaleString()} mi</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.accent }}>${data.total?.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{data.parts?.length} line items</div>
          </div>
        </div>
      </div>

      {/* Parts summary */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Line Items</div>
        {data.parts?.map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #F3F4F6" }}>
            <span style={{ color: COLORS.textSecondary }}>{p.qty}× {p.name}</span>
            <span style={{ fontWeight: 600 }}>${p.price * p.qty}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #F3F4F6", color: COLORS.textSecondary }}>
          <span>Labor (est.)</span>
          <span style={{ fontWeight: 600 }}>${data.laborTotal}</span>
        </div>
      </div>

      {/* Tech assign */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>Assign Technician</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {technicians.map(t => (
            <button key={t.id} onClick={() => setTechId(t.id)} style={{
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: techId === t.id ? COLORS.primary : "#F3F4F6",
              color: techId === t.id ? "#fff" : COLORS.textSecondary,
              border: "none",
            }}>{t.name.split(" ")[0]}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>Notes (optional)</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Customer complaint, special instructions…"
          style={{ width: "100%", height: 60, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <button
        onClick={() => setCreated(true)}
        style={{ width: "100%", padding: "13px", borderRadius: 10, background: COLORS.accent, color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
      >
        Create Repair Order
      </button>
    </div>
  );
}

// ── MAIN WIZARD ────────────────────────────────────────────
export default function NewROWizard({ onClose }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ customerId: null, vehicleId: null, parts: [], inspectionStatuses: {} });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: step === 3 ? 780 : 520,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        transition: "width 0.2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.textPrimary }}>New Repair Order</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Peninsula Precision Auto</div>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={COLORS.textSecondary} />
          </button>
        </div>

        <div style={{ padding: "14px 22px 0", flexShrink: 0 }}>
          <StepIndicator step={step} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 22px 20px" }}>
          {step === 1 && <StepCustomer data={data} setData={setData} onNext={() => setStep(2)} />}
          {step === 2 && <StepInspect data={data} setData={setData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepEstimate data={data} setData={setData} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <StepConfirm data={data} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
