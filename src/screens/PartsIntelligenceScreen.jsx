import { useState } from "react";
import {
  Search, Zap, CheckCircle, Clock, Package, TrendingDown,
  Star, AlertTriangle, ChevronRight, ShoppingCart, BarChart3,
  Truck, DollarSign, Filter, RefreshCw, ExternalLink, Plus,
  ArrowDown, ArrowUp, Award,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ─── Parts Catalog Data ───────────────────────────────────────
const PARTS_ORDERS = [
  {
    id: "po-001",
    roId: "RO-2024-1188",
    customer: "David Kim",
    vehicle: "2019 Honda CR-V",
    partNumber: "16468",
    partName: "Walker Catalytic Converter",
    category: "Exhaust",
    status: "ordered",
    orderedFrom: "eBay Motors",
    price: 298,
    shipsFrom: "Sacramento, CA",
    eta: "Today, 4 PM",
    tracking: "1Z9R48E90376950001",
    savedVs: { vendor: "O'Reilly", price: 342 },
  },
  {
    id: "po-002",
    roId: "RO-2024-1190",
    customer: "James Park",
    vehicle: "2020 BMW X3",
    partNumber: "34-10-6-873-081",
    partName: "BMW Brake Rotor (Front Pair)",
    category: "Brakes",
    status: "delayed",
    orderedFrom: "Worldpac",
    price: 287,
    shipsFrom: "Oakland, CA",
    eta: "Tomorrow (1 day late)",
    tracking: "WP-88421-2024",
    delayReason: "Carrier delay in Oakland hub",
  },
  {
    id: "po-003",
    roId: "RO-2024-1187",
    customer: "Monica Santos",
    vehicle: "2021 Toyota Camry",
    partNumber: "4A068-0E040",
    partName: "Toyota Serpentine Belt",
    category: "Engine",
    status: "received",
    orderedFrom: "O'Reilly",
    price: 42,
    shipsFrom: "Local Store",
    eta: "Received",
    tracking: null,
    savedVs: null,
  },
];

// ─── Live Part Search Results ─────────────────────────────────
const PART_SEARCH_RESULTS = {
  "brake pads honda crv 2019": [
    {
      vendor: "Worldpac",
      logo: "W",
      logoColor: "#1D4ED8",
      logoBg: "#EFF6FF",
      partNum: "AX1350",
      brand: "Akebono ProACT",
      price: 78.40,
      core: 0,
      availability: "In Stock — Oakland (0.8 mi)",
      deliveryTime: "Same day · 2 PM",
      rating: 4.8,
      reviews: 312,
      quality: "OE-Grade",
      warranty: "Limited Lifetime",
      recommended: true,
      badge: "WrenchIQ Pick",
    },
    {
      vendor: "O'Reilly",
      logo: "OR",
      logoColor: "#DC2626",
      logoBg: "#FEF2F2",
      partNum: "14D977CH",
      brand: "Raybestos Element3",
      price: 64.99,
      core: 0,
      availability: "In Stock — Menlo Park (1.2 mi)",
      deliveryTime: "Counter pickup now",
      rating: 4.5,
      reviews: 187,
      quality: "OE-Equivalent",
      warranty: "Limited Lifetime",
      recommended: false,
      badge: null,
    },
    {
      vendor: "eBay Motors",
      logo: "EB",
      logoColor: "#E53238",
      logoBg: "#FFF0F0",
      partNum: "14D977CH",
      brand: "Bosch QuietCast",
      price: 51.20,
      core: 0,
      availability: "Ships from Los Angeles",
      deliveryTime: "Tomorrow by noon",
      rating: 4.6,
      reviews: 1240,
      quality: "OE-Equivalent",
      warranty: "1 Year",
      recommended: false,
      badge: "Lowest Price",
    },
    {
      vendor: "NAPA",
      logo: "N",
      logoColor: "#003087",
      logoBg: "#EFF6FF",
      partNum: "NP756",
      brand: "NAPA Premium",
      price: 69.99,
      core: 0,
      availability: "In Stock — Palo Alto (0.4 mi)",
      deliveryTime: "Counter pickup now",
      rating: 4.3,
      reviews: 98,
      quality: "OE-Equivalent",
      warranty: "Limited Lifetime",
      recommended: false,
      badge: null,
    },
    {
      vendor: "RockAuto",
      logo: "RA",
      logoColor: "#374151",
      logoBg: "#F9FAFB",
      partNum: "PGD757C",
      brand: "Posi-Quiet Ceramic",
      price: 43.79,
      core: 0,
      availability: "Ships from Warehouse",
      deliveryTime: "3–5 days",
      rating: 4.4,
      reviews: 2100,
      quality: "Economy",
      warranty: "90 Days",
      recommended: false,
      badge: null,
    },
  ],
};

const DEFAULT_SEARCH = "brake pads honda crv 2019";

// ─── Inventory Items ──────────────────────────────────────────
const INVENTORY = [
  { id: "inv-001", name: "Engine Oil 5W-30 Synthetic (qt)", partNum: "PEN-5W30", qty: 48, minQty: 12, unitCost: 7.20, monthlyUsage: 32, reorderPoint: "OK", category: "Fluids" },
  { id: "inv-002", name: "Oil Filter (Honda/Toyota)", partNum: "PH8A", qty: 14, minQty: 8, unitCost: 4.80, monthlyUsage: 22, reorderPoint: "OK", category: "Filters" },
  { id: "inv-003", name: "Cabin Air Filter (Universal)", partNum: "CF11182", qty: 3, minQty: 6, unitCost: 12.40, monthlyUsage: 8, reorderPoint: "Reorder", category: "Filters" },
  { id: "inv-004", name: "Brake Pads — Ceramic Front (mid-size)", partNum: "14D977CH", qty: 2, minQty: 4, unitCost: 62.00, monthlyUsage: 6, reorderPoint: "Reorder", category: "Brakes" },
  { id: "inv-005", name: "Serpentine Belt (universal cross-ref)", partNum: "K060935", qty: 7, minQty: 3, unitCost: 28.00, monthlyUsage: 4, reorderPoint: "OK", category: "Engine" },
  { id: "inv-006", name: "Coolant Antifreeze (gal)", partNum: "PEAK-GAL", qty: 9, minQty: 4, unitCost: 14.50, monthlyUsage: 5, reorderPoint: "OK", category: "Fluids" },
  { id: "inv-007", name: "Wiper Blades (19\")", partNum: "BEAM-19", qty: 0, minQty: 4, unitCost: 11.00, monthlyUsage: 6, reorderPoint: "Critical", category: "Accessories" },
];

// ─── Stats ────────────────────────────────────────────────────
function PartsStats() {
  const stats = [
    { label: "Parts Savings (Month)", value: "$847", sub: "vs. single-vendor pricing", icon: TrendingDown, color: "#059669" },
    { label: "Avg Delivery Time", value: "3.2 hrs", sub: "same-day rate: 71%", icon: Truck, color: "#3B82F6" },
    { label: "Pending Orders", value: "3", sub: "1 delayed, 2 on time", icon: Package, color: COLORS.accent },
    { label: "Inventory Alerts", value: "3", sub: "items below minimum", icon: AlertTriangle, color: "#EF4444" },
  ];
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, marginTop: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={17} color={s.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Search Result Row ────────────────────────────────────────
function PartResultRow({ part, rank }) {
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const handleOrder = () => {
    setOrdering(true);
    setTimeout(() => { setOrdering(false); setOrdered(true); }, 1200);
  };

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "center",
      padding: "12px 16px",
      borderBottom: "1px solid #F3F4F6",
      background: part.recommended ? "linear-gradient(90deg, #FFFBEB, #fff)" : (ordered ? "#F0FDF4" : "#fff"),
    }}>
      {/* Rank */}
      <div style={{ width: 20, textAlign: "center", fontSize: 11, fontWeight: 800, color: rank === 1 ? "#F59E0B" : COLORS.textMuted, flexShrink: 0 }}>
        {rank === 1 ? <Award size={14} color="#F59E0B" /> : rank}
      </div>

      {/* Vendor */}
      <div style={{ width: 32, height: 32, borderRadius: 8, background: part.logoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: part.logoColor, flexShrink: 0, letterSpacing: -0.5 }}>
        {part.logo}
      </div>

      {/* Part info */}
      <div style={{ flex: 2 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{part.brand}</span>
          {part.badge && (
            <span style={{ fontSize: 9, fontWeight: 700, background: part.recommended ? "#FFFBEB" : "#F0FDF4", color: part.recommended ? "#D97706" : "#059669", borderRadius: 4, padding: "1px 5px" }}>
              {part.badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>#{part.partNum} · {part.quality} · {part.warranty}</div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "center", minWidth: 60 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>${part.price.toFixed(2)}</div>
        {part.core > 0 && <div style={{ fontSize: 9, color: COLORS.textMuted }}>+${part.core} core</div>}
      </div>

      {/* Availability */}
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary }}>{part.availability}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Truck size={10} color="#059669" />
          <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>{part.deliveryTime}</span>
        </div>
      </div>

      {/* Rating */}
      <div style={{ textAlign: "center", minWidth: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}>
          <Star size={10} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{part.rating}</span>
        </div>
        <div style={{ fontSize: 9, color: COLORS.textMuted }}>{part.reviews} reviews</div>
      </div>

      {/* Order */}
      <div style={{ minWidth: 90 }}>
        {ordered ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#059669", fontSize: 11, fontWeight: 700 }}>
            <CheckCircle size={14} /> Ordered
          </div>
        ) : (
          <button
            onClick={handleOrder}
            style={{
              background: part.recommended ? COLORS.accent : COLORS.primary,
              color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px",
              fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              opacity: ordering ? 0.7 : 1,
            }}
          >
            {ordering ? "Ordering…" : part.recommended ? "Order ✦" : "Order"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Open Order Card ──────────────────────────────────────────
function OrderCard({ order }) {
  const statusConfig = {
    ordered: { color: "#3B82F6", bg: "#EFF6FF", label: "Ordered", icon: Package },
    delayed: { color: "#EF4444", bg: "#FEF2F2", label: "Delayed", icon: AlertTriangle },
    received: { color: "#059669", bg: "#ECFDF5", label: "Received", icon: CheckCircle },
  };
  const sc = statusConfig[order.status] || statusConfig.ordered;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${order.status === "delayed" ? "#FECACA" : "#E5E7EB"}`, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{order.partName}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>#{order.partNum} · {order.roId} · {order.customer}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: sc.bg, borderRadius: 6, padding: "3px 8px" }}>
          <sc.icon size={11} color={sc.color} />
          <span style={{ fontSize: 10, fontWeight: 700, color: sc.color }}>{sc.label}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Vendor", value: order.orderedFrom },
          { label: "Price", value: `$${order.price}` },
          { label: "ETA", value: order.eta },
        ].map((row, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{row.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: order.status === "delayed" && row.label === "ETA" ? "#EF4444" : COLORS.textPrimary }}>{row.value}</div>
          </div>
        ))}
        {order.savedVs && (
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>Saved vs</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>
              ${(order.savedVs.price - order.price).toFixed(0)} vs {order.savedVs.vendor}
            </div>
          </div>
        )}
      </div>

      {order.status === "delayed" && (
        <div style={{ marginTop: 8, background: "#FEF2F2", borderRadius: 6, padding: "6px 8px", fontSize: 11, color: "#991B1B" }}>
          <strong>Delay:</strong> {order.delayReason}
        </div>
      )}
    </div>
  );
}

// ─── Inventory Row ────────────────────────────────────────────
function InventoryRow({ item }) {
  const statusConfig = {
    Critical: { color: "#EF4444", bg: "#FEF2F2" },
    Reorder: { color: "#F59E0B", bg: "#FFFBEB" },
    OK: { color: "#059669", bg: "#ECFDF5" },
  };
  const sc = statusConfig[item.reorderPoint] || statusConfig.OK;
  const pct = Math.min(100, (item.qty / (item.minQty * 3)) * 100);

  return (
    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
      <td style={{ padding: "10px 14px" }}>
        <div style={{ fontWeight: 600, fontSize: 12 }}>{item.name}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted }}>#{item.partNum}</div>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, minWidth: 60 }}>
            <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: pct > 50 ? "#059669" : pct > 25 ? "#F59E0B" : "#EF4444" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 24, textAlign: "right" }}>{item.qty}</span>
        </div>
        <div style={{ fontSize: 10, color: COLORS.textMuted }}>Min: {item.minQty}</div>
      </td>
      <td style={{ padding: "10px 14px", fontSize: 12 }}>{item.monthlyUsage}/mo</td>
      <td style={{ padding: "10px 14px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, borderRadius: 4, padding: "2px 7px" }}>
          {item.reorderPoint}
        </span>
      </td>
      <td style={{ padding: "10px 14px" }}>
        {item.reorderPoint !== "OK" && (
          <button style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Reorder
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function PartsIntelligenceScreen() {
  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [activeTab, setActiveTab] = useState("search"); // "search" | "orders" | "inventory"
  const [sortBy, setSortBy] = useState("recommended");

  const results = PART_SEARCH_RESULTS[search.toLowerCase()] || PART_SEARCH_RESULTS[DEFAULT_SEARCH];

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "delivery") return a.deliveryTime.localeCompare(b.deliveryTime);
    if (sortBy === "rating") return b.rating - a.rating;
    // recommended: WrenchIQ pick first
    return (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0);
  });

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>Parts Intelligence</h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            Compare 6 vendors in real-time. WrenchIQ picks the best part for your shop.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#F3F4F6", color: COLORS.textSecondary, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh Prices
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={13} /> Add to Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <PartsStats />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, background: "#F3F4F6", borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content" }}>
        {[
          { key: "search", label: "Part Search" },
          { key: "orders", label: `Open Orders (${PARTS_ORDERS.length})` },
          { key: "inventory", label: "Inventory" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? COLORS.textPrimary : COLORS.textMuted, boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none", whiteSpace: "nowrap" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Part Search */}
      {activeTab === "search" && (
        <div>
          {/* Search Bar */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center", background: "#F9FAFB", borderRadius: 10, padding: "9px 14px", border: "1px solid #E5E7EB" }}>
                <Search size={15} color={COLORS.textMuted} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by part name, number, or describe the job…"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13 }}
                />
              </div>
              <button style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Search
              </button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["brake pads honda crv 2019", "oil filter toyota camry", "serpentine belt bmw x3 2020"].map(q => (
                <button key={q} onClick={() => setSearch(q)} style={{ fontSize: 11, background: search === q ? COLORS.primary + "15" : "#F3F4F6", color: search === q ? COLORS.primary : COLORS.textSecondary, border: `1px solid ${search === q ? COLORS.primary + "40" : "transparent"}`, borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontWeight: 500 }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            {/* Table Header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 10, alignItems: "center", background: "#F9FAFB" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {results.length} vendors compared for "{search}"
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>Sort:</span>
                {["recommended", "price", "delivery", "rating"].map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, border: "1px solid", borderColor: sortBy === s ? COLORS.primary : "#E5E7EB", background: sortBy === s ? COLORS.primary : "transparent", color: sortBy === s ? "#fff" : COLORS.textSecondary, cursor: "pointer", textTransform: "capitalize" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Headers */}
            <div style={{ display: "flex", gap: 12, padding: "8px 16px 8px 48px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6", fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div style={{ width: 32 }} />
              <div style={{ flex: 2 }}>Part / Brand</div>
              <div style={{ minWidth: 60, textAlign: "center" }}>Price</div>
              <div style={{ flex: 2 }}>Availability & Delivery</div>
              <div style={{ minWidth: 60, textAlign: "center" }}>Rating</div>
              <div style={{ minWidth: 90 }}>Action</div>
            </div>

            {sorted.map((part, i) => (
              <PartResultRow key={part.vendor} part={part} rank={i + 1} />
            ))}

            {/* WrenchIQ Pick explanation */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", background: "#FFFBEB", display: "flex", gap: 8, alignItems: "center" }}>
              <Zap size={13} color="#D97706" />
              <div style={{ fontSize: 11, color: "#92400E" }}>
                <strong>WrenchIQ Pick = Akebono ProACT:</strong> OE-Grade quality matches manufacturer spec for 2019 CR-V. Same-day availability from Worldpac Oakland minimizes labor delay. Warranty claim rate 0.8% vs 3.2% for economy brands.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Orders */}
      {activeTab === "orders" && (
        <div style={{ maxWidth: 680 }}>
          {PARTS_ORDERS.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Inventory */}
      {activeTab === "inventory" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Shop Inventory</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, background: "#FEF2F2", borderRadius: 6, padding: "3px 8px" }}>
                {INVENTORY.filter(i => i.reorderPoint !== "OK").length} need reorder
              </div>
              <button style={{ fontSize: 12, fontWeight: 700, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
                Auto-Reorder All
              </button>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Part", "Stock Level", "Monthly Usage", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map(item => <InventoryRow key={item.id} item={item} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
