import { useState } from "react";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  Send,
  Car,
  Wrench,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Star,
  AlertTriangle,
  PlusCircle,
  Play,
  Video,
  Share2,
  Bell,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import {
  customers,
  vehicles,
  repairOrders,
  getCustomer,
  getVehicle,
  getVehiclesByCustomer,
  SHOP,
} from "../data/demoData";
import IPhoneFrame from "../components/shared/IPhoneFrame";

// ── Build per-customer data ────────────────────────────────
function buildCustomerRows() {
  return customers.map((customer) => {
    const custVehicles = (customer.vehicleIds || []).map((id) => getVehicle(id)).filter(Boolean);
    const activeRO = repairOrders.find(
      (ro) =>
        ro.customerId === customer.id &&
        ["in_progress", "inspecting", "estimate_sent", "checked_in", "approved"].includes(ro.status)
    );
    const primaryVehicle = activeRO ? getVehicle(activeRO.vehicleId) : custVehicles[0] || null;
    return { customer, vehicles: custVehicles, primaryVehicle, activeRO };
  });
}

const CUSTOMER_ROWS = buildCustomerRows();

// ── Static content for Monica's active RO ─────────────────
const MONICA_SERVICE_ITEMS = [
  {
    id: "svc-air-filter",
    name: "Engine Air Filter",
    price: 87,
    badge: "URGENT",
    badgeColor: COLORS.danger,
    badgeBg: "#FEF2F2",
    finding: "AI found 40% obstruction",
    whyExplanation:
      "Your engine air filter is like a face mask for your car's engine. Ours found it's about 40% clogged with dirt and debris — that's like running a half-marathon while breathing through a dirty sock. Replacing it now will improve your fuel economy and protect your engine from wear. At 58K miles, this filter is about 28K miles overdue.",
    canDecline: true,
  },
  {
    id: "svc-serpentine-belt",
    name: "Serpentine Belt",
    price: 126,
    badge: "URGENT",
    badgeColor: COLORS.danger,
    badgeBg: "#FEF2F2",
    finding: "Cracking on 3 ribs",
    whyExplanation:
      "The serpentine belt drives your alternator, A/C compressor, and power steering pump. James photographed visible cracks on 3 of its 6 ribs — that means it's getting close to snapping. If it breaks while you're driving, your car will lose power steering and eventually stall. Replacing it now for $126 avoids a potential tow and roadside emergency.",
    canDecline: true,
  },
  {
    id: "svc-cabin-filter",
    name: "Cabin Air Filter",
    price: 81,
    badge: "RECOMMENDED",
    badgeColor: "#2563EB",
    badgeBg: "#EFF6FF",
    finding: "Moderate debris accumulation",
    whyExplanation:
      "The cabin air filter cleans the air that comes through your vents. Yours shows moderate pollen and debris buildup — important during Bay Area wildfire season. Replacing it ($81) means cleaner air for you and your passengers.",
    canDecline: true,
  },
  {
    id: "svc-brake-pads",
    name: "Front Brake Pads",
    price: 340,
    badge: "MONITOR",
    badgeColor: COLORS.warning,
    badgeBg: "#FFFBEB",
    finding: "4mm remaining, ~10K miles left",
    whyExplanation:
      "Your front brake pads are at 4mm — pads start new at 12mm and should be replaced at 2mm. You have roughly 10,000 miles before they hit the minimum. No immediate safety risk, but we'd recommend planning a replacement at your next visit.",
    canDecline: false,
  },
];

const MONICA_PROGRESS_STEPS = [
  { label: "Checked In", time: "8:02 AM", desc: "Your Camry is with us", state: "done" },
  { label: "Inspection Complete", time: "9:15 AM", desc: "James found a few things to show you", state: "done" },
  { label: "Your Approval", time: "10:30 AM", desc: "Please review and approve services", state: "current" },
  { label: "Repair In Progress", time: null, desc: "We'll start as soon as you approve", state: "pending" },
  { label: "Quality Check", time: null, desc: "Final inspection before pickup", state: "pending" },
  { label: "Ready for Pickup", time: null, desc: "We'll text you! 📱", state: "pending" },
];

// Per-customer simple progress states
const CUSTOMER_PORTAL_DATA = {
  "cust-002": {
    greeting: "Hi David! 👋",
    subtitle: "Here's the latest on your CR-V",
    steps: [
      { label: "Checked In", time: "8:30 AM", desc: "CR-V is in Bay 2", state: "done" },
      { label: "Inspection In Progress", time: "9:05 AM", desc: "Mike is running diagnostics on CEL P0420", state: "current" },
      { label: "Your Approval", time: null, desc: "Estimate coming shortly", state: "pending" },
      { label: "Repair In Progress", time: null, desc: "We'll start once you approve", state: "pending" },
      { label: "Quality Check", time: null, desc: "Final check before pickup", state: "pending" },
      { label: "Ready for Pickup", time: null, desc: "We'll text you! 📱", state: "pending" },
    ],
    statusLine: "Diagnostic in progress — est. 2 hrs",
    total: "$2,190",
  },
  "cust-004": {
    greeting: "Hi James! 👋",
    subtitle: "Here's the latest on your BMW X3",
    steps: [
      { label: "Checked In", time: "9:00 AM", desc: "X3 is in Bay 3", state: "done" },
      { label: "Inspection Complete", time: "10:20 AM", desc: "James K. found front brake vibration cause", state: "done" },
      { label: "Estimate Sent", time: "10:45 AM", desc: "Please review your estimate", state: "current" },
      { label: "Awaiting Approval", time: null, desc: "Tap below to approve", state: "pending" },
      { label: "Repair In Progress", time: null, desc: "OEM parts ordered", state: "pending" },
      { label: "Ready for Pickup", time: null, desc: "Est. 4:00 PM today 📱", state: "pending" },
    ],
    statusLine: "Waiting for your approval",
    total: "$1,892",
  },
  "cust-006": {
    greeting: "Hi Robert! 👋",
    subtitle: "Here's the latest on your F-150",
    steps: [
      { label: "Checked In", time: "10:00 AM", desc: "F-150 is checked in", state: "done" },
      { label: "In Queue", time: "10:05 AM", desc: "Waiting for Bay 5", state: "current" },
      { label: "Inspection", time: null, desc: "Lisa will handle oil + tires", state: "pending" },
      { label: "Your Approval", time: null, desc: "Any add-ons?", state: "pending" },
      { label: "Repair In Progress", time: null, desc: "", state: "pending" },
      { label: "Ready for Pickup", time: null, desc: "Est. 1:30 PM 📱", state: "pending" },
    ],
    statusLine: "Checked in — awaiting bay assignment",
    total: "$285",
  },
  "cust-007": {
    greeting: "Hi Tom! 👋",
    subtitle: "Here's the latest on your Tucson",
    steps: [
      { label: "Checked In", time: "10:30 AM", desc: "Tucson is in Bay 4", state: "done" },
      { label: "Inspection In Progress", time: "10:40 AM", desc: "Oil + multi-point underway", state: "done" },
      { label: "Your Approval", time: "11:05 AM", desc: "One item needs your OK", state: "current" },
      { label: "Repair In Progress", time: null, desc: "Approved work will start shortly", state: "pending" },
      { label: "Quality Check", time: null, desc: "", state: "pending" },
      { label: "Ready for Pickup", time: null, desc: "Est. 2:00 PM 📱", state: "pending" },
    ],
    statusLine: "Awaiting your approval on 1 item",
    total: "$412",
  },
};

const BOOKING_MESSAGES = [
  { id: "bk-1", role: "customer", text: "I need an oil change next month" },
  {
    id: "bk-2",
    role: "ai",
    text: "I'd be happy to help! We have openings on:\n📅 Dec 12 (Thu) 8:00 AM\n📅 Dec 13 (Fri) 10:00 AM\n📅 Dec 16 (Mon) 9:00 AM\nWhich works best?",
  },
];

const CHAT_MESSAGES = [
  { id: "msg-1", role: "ai", text: "Hi Monica! Your Camry's 60K service is about 35% complete. Need anything?" },
  { id: "msg-2", role: "customer", text: "How long will it take?" },
  { id: "msg-3", role: "ai", text: "James is finishing the brake inspection now. We expect your Camry ready by 2:30 PM. Would you like a text when it's done? 📱" },
  { id: "msg-4", role: "customer", text: "Yes please, and can I add the cabin filter?" },
  { id: "msg-5", role: "ai", text: "Great choice! I've added the cabin air filter ($81) to your service. Your updated total is $375. Would you like to approve it now?" },
];

// ── Helpers ────────────────────────────────────────────────

function statusLabel(status) {
  const map = {
    in_progress: "In Progress",
    inspecting: "Inspecting",
    estimate_sent: "Estimate Sent",
    checked_in: "Checked In",
    approved: "Approved",
    scheduled: "Scheduled",
  };
  return map[status] || status;
}

function statusColor(status) {
  const map = {
    in_progress: COLORS.accent,
    inspecting: "#2563EB",
    estimate_sent: COLORS.warning,
    checked_in: COLORS.success,
    approved: COLORS.success,
    scheduled: COLORS.textMuted,
  };
  return map[status] || COLORS.textMuted;
}

function avatarColors(idx) {
  const pairs = [
    { bg: "#1B3461", text: "#fff" },
    { bg: "#7C3AED", text: "#fff" },
    { bg: "#0D9488", text: "#fff" },
    { bg: "#B45309", text: "#fff" },
    { bg: "#BE185D", text: "#fff" },
    { bg: "#1E40AF", text: "#fff" },
    { bg: "#065F46", text: "#fff" },
    { bg: "#9F1239", text: "#fff" },
  ];
  return pairs[idx % pairs.length];
}

// ── Sub-components ─────────────────────────────────────────

function StepDot({ state }) {
  if (state === "done") {
    return (
      <div style={{ width: 26, height: 26, borderRadius: 13, background: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <CheckCircle size={14} color="#fff" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div style={{ width: 26, height: 26, borderRadius: 13, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 4px rgba(255,107,53,0.2)" }}>
        <div style={{ width: 9, height: 9, borderRadius: 5, background: "#fff" }} />
      </div>
    );
  }
  return (
    <div style={{ width: 26, height: 26, borderRadius: 13, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: 9, height: 9, borderRadius: 5, background: "#9CA3AF" }} />
    </div>
  );
}

function ChatBubble({ msg }) {
  const isAI = msg.role === "ai";
  return (
    <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", marginBottom: 8 }}>
      {isAI && (
        <div style={{ width: 22, height: 22, borderRadius: 11, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 5, flexShrink: 0, alignSelf: "flex-end" }}>
          <Sparkles size={11} color="#fff" />
        </div>
      )}
      <div style={{ maxWidth: "78%", padding: "7px 10px", borderRadius: isAI ? "12px 12px 12px 3px" : "12px 12px 3px 12px", background: isAI ? "#F3F4F6" : COLORS.primary, color: isAI ? COLORS.textPrimary : "#fff", fontSize: 10.5, lineHeight: 1.5, whiteSpace: "pre-line" }}>
        {msg.text}
      </div>
    </div>
  );
}

// ── Progress tracker used in phone ─────────────────────────

function ProgressTracker({ steps }) {
  return (
    <div style={{ margin: "10px 14px", background: "#fff", borderRadius: 12, padding: "12px 12px", boxShadow: "0 1px 5px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>Service Progress</div>
      {steps.map((step, idx) => (
        <div key={idx} style={{ display: "flex", gap: 9, marginBottom: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26 }}>
            <StepDot state={step.state} />
            {idx < steps.length - 1 && (
              <div style={{ width: 2, flex: 1, minHeight: 16, background: step.state === "done" ? COLORS.success : "#E5E7EB", margin: "2px 0" }} />
            )}
          </div>
          <div style={{ paddingTop: 3, paddingBottom: idx < steps.length - 1 ? 10 : 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: step.state === "current" ? 700 : 600, color: step.state === "pending" ? COLORS.textMuted : COLORS.textPrimary }}>
              {step.label}
              {step.time && <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 9.5, marginLeft: 5 }}>{step.time}</span>}
            </div>
            {step.desc && (
              <div style={{ fontSize: 9.5, color: step.state === "current" ? COLORS.accent : COLORS.textMuted, marginTop: 1, fontWeight: step.state === "current" ? 600 : 400 }}>
                {step.desc}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Monica's detailed service approval view ────────────────

function MonicaPhoneContent({ approvedItems, setApprovedItems, expandedWhyItem, setExpandedWhyItem, chatExpanded, setChatExpanded }) {
  const approvedTotal = MONICA_SERVICE_ITEMS.filter((s) => approvedItems.has(s.id)).reduce((sum, s) => sum + s.price, 0);

  const toggleApprove = (id) => {
    setApprovedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ background: "#F8F9FA", minHeight: "100%", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>
      {/* Shop Header */}
      <div style={{ background: COLORS.primary, padding: "12px 14px 14px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Wrench size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{SHOP.name}</div>
            <div style={{ fontSize: 9.5, opacity: 0.75, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
              <MapPin size={8} /> Palo Alto, CA
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>Hi Monica! 👋</div>
        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Here's the latest on your Camry</div>
      </div>

      <ProgressTracker steps={MONICA_PROGRESS_STEPS} />

      {/* Service approval */}
      <div style={{ padding: "0 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 7 }}>Review & Approve Services</div>

        {MONICA_SERVICE_ITEMS.map((item) => {
          const isApproved = approvedItems.has(item.id);
          const isExpanded = expandedWhyItem === item.id;
          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: 11, marginBottom: 7, border: `1.5px solid ${isApproved ? COLORS.success : "#E5E7EB"}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "10px 11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, color: item.badgeColor, background: item.badgeBg, padding: "2px 6px", borderRadius: 20, letterSpacing: 0.5, textTransform: "uppercase" }}>{item.badge}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary }}>${item.price}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{item.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 7 }}>{item.finding}</div>

                <button onClick={() => setExpandedWhyItem(isExpanded ? null : item.id)} style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", padding: 0, cursor: "pointer", color: COLORS.primary, fontSize: 9.5, fontWeight: 600, marginBottom: isExpanded ? 7 : 0 }}>
                  <Sparkles size={9} /> Why is this needed? {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                </button>

                {isExpanded && (
                  <div style={{ background: "#F0F9FF", borderRadius: 7, padding: "8px 9px", fontSize: 9.5, color: "#1E40AF", lineHeight: 1.55, marginBottom: 7, borderLeft: "3px solid #3B82F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3, fontWeight: 700, fontSize: 9 }}><Sparkles size={8} /> AI Explanation</div>
                    {item.whyExplanation}
                  </div>
                )}

                {item.canDecline ? (
                  <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
                    <button onClick={() => toggleApprove(item.id)} style={{ flex: 1, padding: "6px 0", borderRadius: 7, background: isApproved ? COLORS.success : "#fff", color: isApproved ? "#fff" : COLORS.success, border: `1.5px solid ${COLORS.success}`, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      {isApproved ? "✓ Approved" : "Approve"}
                    </button>
                    <button style={{ flex: 1, padding: "6px 0", borderRadius: 7, background: "#fff", color: COLORS.textSecondary, border: "1.5px solid #E5E7EB", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Decline</button>
                  </div>
                ) : (
                  <button style={{ width: "100%", marginTop: 3, padding: "6px 0", borderRadius: 7, background: "#FFFBEB", color: COLORS.warning, border: "1.5px solid #FDE68A", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Defer to next visit</button>
                )}
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div style={{ background: COLORS.primary, borderRadius: 12, padding: "12px 12px", marginBottom: 10, color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 10, opacity: 0.75 }}>{approvedItems.size > 0 ? `${approvedItems.size} service${approvedItems.size > 1 ? "s" : ""} approved` : "Approve services above"}</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>${approvedTotal > 0 ? approvedTotal.toLocaleString() : "0"}</span>
          </div>
          <button style={{ width: "100%", padding: "9px 0", borderRadius: 9, background: approvedItems.size > 0 ? COLORS.accent : "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: approvedItems.size > 0 ? "pointer" : "default", marginTop: 5 }}>
            Approve Selected & Pay Deposit
          </button>
        </div>
      </div>

      {/* AI Chat */}
      <div style={{ padding: "0 14px 14px" }}>
        {!chatExpanded ? (
          <button onClick={() => setChatExpanded(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "10px 12px", borderRadius: 11, background: COLORS.primary, border: "none", color: "#fff", cursor: "pointer", marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={12} color="#fff" /></div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Chat with PrediiAgent</div>
              <div style={{ fontSize: 9.5, opacity: 0.75, marginTop: 1 }}>Ask anything about your service</div>
            </div>
            <MessageCircle size={14} color="rgba(255,255,255,0.7)" />
          </button>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E5E7EB", overflow: "hidden", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <div style={{ background: COLORS.primary, padding: "9px 11px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={11} color="#fff" /></div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#fff" }}>PrediiAgent Assistant</div>
                  <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.65)" }}>Online now</div>
                </div>
              </div>
              <button onClick={() => setChatExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 2 }}><X size={13} /></button>
            </div>
            <div style={{ padding: "10px 9px", maxHeight: 180, overflowY: "auto" }}>
              {CHAT_MESSAGES.map((msg) => <ChatBubble key={msg.id} msg={msg} />)}
            </div>
            <div style={{ padding: "7px 9px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 18, padding: "6px 10px", fontSize: 10, color: COLORS.textMuted }}>Ask anything…</div>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Send size={11} color="#fff" /></div>
            </div>
            <div style={{ padding: "5px 11px", background: "#F9FAFB", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Sparkles size={8} color={COLORS.textMuted} />
              <span style={{ fontSize: 8.5, color: COLORS.textMuted, fontWeight: 500 }}>Powered by Claude</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Generic active RO phone content ───────────────────────

function ActiveROPhoneContent({ customer, vehicle, ro, portalData }) {
  const steps = portalData?.steps || [];
  const statusLine = portalData?.statusLine || "";
  const total = portalData?.total || `$${ro.totalEstimate?.toLocaleString() || "—"}`;

  return (
    <div style={{ background: "#F8F9FA", minHeight: "100%", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>
      <div style={{ background: COLORS.primary, padding: "12px 14px 14px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Wrench size={16} color="#fff" /></div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{SHOP.name}</div>
            <div style={{ fontSize: 9.5, opacity: 0.75, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}><MapPin size={8} /> Palo Alto, CA</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>
          Hi {customer.firstName}! 👋
        </div>
        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
          Here's the latest on your {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "vehicle"}
        </div>
      </div>

      <ProgressTracker steps={steps} />

      {/* Status summary card */}
      <div style={{ margin: "0 14px 10px", background: "#fff", borderRadius: 12, padding: "12px 13px", border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary }}>Service Summary</div>
          <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>{total}</span>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>{ro.serviceType}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, background: statusColor(ro.status) }} />
          <span style={{ fontSize: 10, color: statusColor(ro.status), fontWeight: 600 }}>{statusLine}</span>
        </div>

        {/* AI insights */}
        {ro.aiInsights && ro.aiInsights.length > 0 && (
          <div style={{ marginTop: 10, borderTop: "1px solid #F3F4F6", paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
              <Sparkles size={9} color={COLORS.primary} />
              <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.primary }}>AI Notes for Advisor</span>
            </div>
            {ro.aiInsights.slice(0, 2).map((insight, i) => (
              <div key={i} style={{ fontSize: 9, color: COLORS.textSecondary, marginBottom: 3, paddingLeft: 8, borderLeft: "2px solid #E5E7EB" }}>{insight}</div>
            ))}
          </div>
        )}
      </div>

      {/* Booking section */}
      <div style={{ margin: "0 14px 14px", background: "#fff", borderRadius: 12, border: "1.5px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ background: "linear-gradient(135deg, #1A5C6B 0%, #0D3B45 100%)", padding: "9px 11px", display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={13} color="#fff" />
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#fff" }}>Questions? Chat with us</div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.65)" }}>Powered by Claude</div>
          </div>
        </div>
        <div style={{ padding: "9px 9px 4px" }}>
          {BOOKING_MESSAGES.slice(0, 1).map((msg) => <ChatBubble key={msg.id} msg={msg} />)}
          <ChatBubble msg={{ id: "ai-gen", role: "ai", text: `Hi ${customer.firstName}! I'm here to help. What questions do you have about your service today?` }} />
        </div>
        <div style={{ padding: "7px 9px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 18, padding: "6px 10px", fontSize: 10, color: COLORS.textMuted }}>Ask anything…</div>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Send size={11} color="#fff" /></div>
        </div>
        <div style={{ padding: "5px 11px", background: "#F9FAFB", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Sparkles size={8} color={COLORS.textMuted} />
          <span style={{ fontSize: 8.5, color: COLORS.textMuted, fontWeight: 500 }}>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
}

// ── No active service phone content ────────────────────────

function NoActiveServicePhoneContent({ customer, vehicles: custVehicles }) {
  const primaryVehicle = custVehicles[0];
  return (
    <div style={{ background: "#F8F9FA", minHeight: "100%", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>
      <div style={{ background: COLORS.primary, padding: "12px 14px 14px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Wrench size={16} color="#fff" /></div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{SHOP.name}</div>
            <div style={{ fontSize: 9.5, opacity: 0.75, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}><MapPin size={8} /> Palo Alto, CA</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 14px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 2 }}>
          Hi {customer.firstName}! 👋
        </div>
        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Welcome to your service portal</div>
      </div>

      {/* No active service card */}
      <div style={{ margin: "12px 14px", background: "#fff", borderRadius: 12, padding: "20px 14px", textAlign: "center", border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Car size={22} color={COLORS.textMuted} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>No Active Service</div>
        <div style={{ fontSize: 10.5, color: COLORS.textSecondary, lineHeight: 1.5, marginBottom: 14 }}>
          {primaryVehicle
            ? `Your ${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model} isn't currently in for service.`
            : "No vehicle currently in for service."}
          {primaryVehicle?.nextServiceType && (
            <> Next up: <strong>{primaryVehicle.nextServiceType}</strong> at {primaryVehicle.nextServiceMiles?.toLocaleString()} miles.</>
          )}
        </div>
        <button style={{ width: "100%", padding: "10px 0", borderRadius: 9, background: COLORS.accent, border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Calendar size={12} /> Book an Appointment
        </button>
      </div>

      {/* Vehicles */}
      {custVehicles.length > 0 && (
        <div style={{ padding: "0 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 7 }}>Your Vehicles</div>
          {custVehicles.map((v) => (
            <div key={v.id} style={{ background: "#fff", borderRadius: 11, padding: "10px 12px", marginBottom: 7, border: "1.5px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textPrimary }}>{v.year} {v.make} {v.model}</div>
              <div style={{ fontSize: 9.5, color: COLORS.textSecondary, marginTop: 2 }}>{v.trim} · {v.mileage?.toLocaleString()} mi</div>
              {v.nextServiceType && (
                <div style={{ marginTop: 6, fontSize: 9.5, color: "#B45309", background: "#FFFBEB", borderRadius: 5, padding: "3px 7px", display: "inline-block", fontWeight: 600 }}>
                  Next: {v.nextServiceType}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking chat */}
      <div style={{ margin: "10px 14px 14px", background: "#fff", borderRadius: 12, border: "1.5px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ background: "linear-gradient(135deg, #1A5C6B 0%, #0D3B45 100%)", padding: "9px 11px", display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={13} color="#fff" />
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#fff" }}>Book Your Next Visit</div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.65)" }}>AI scheduling assistant</div>
          </div>
        </div>
        <div style={{ padding: "9px 9px 4px" }}>
          <ChatBubble msg={{ id: "ai-1", role: "ai", text: `Hi ${customer.firstName}! Ready to schedule your next service? Just tell me what you need and I'll find the best time.` }} />
          <ChatBubble msg={{ id: "bk-1", role: "customer", text: BOOKING_MESSAGES[0].text }} />
          <ChatBubble msg={{ id: "ai-2", role: "ai", text: BOOKING_MESSAGES[1].text }} />
        </div>
        <div style={{ padding: "7px 9px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 18, padding: "6px 10px", fontSize: 10, color: COLORS.textMuted }}>Choose a time or ask…</div>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Send size={11} color="#fff" /></div>
        </div>
        <div style={{ padding: "5px 11px", background: "#F9FAFB", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Sparkles size={8} color={COLORS.textMuted} />
          <span style={{ fontSize: 8.5, color: COLORS.textMuted, fontWeight: 500 }}>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
}

// ── Phone content dispatcher ───────────────────────────────

function PhoneContent({ row, approvedItems, setApprovedItems, expandedWhyItem, setExpandedWhyItem, chatExpanded, setChatExpanded }) {
  const { customer, vehicles: custVehicles, primaryVehicle, activeRO } = row;

  if (!activeRO) {
    return <NoActiveServicePhoneContent customer={customer} vehicles={custVehicles} />;
  }

  if (customer.id === "cust-003") {
    // Monica — detailed service approval view
    return (
      <MonicaPhoneContent
        approvedItems={approvedItems}
        setApprovedItems={setApprovedItems}
        expandedWhyItem={expandedWhyItem}
        setExpandedWhyItem={setExpandedWhyItem}
        chatExpanded={chatExpanded}
        setChatExpanded={setChatExpanded}
      />
    );
  }

  const portalData = CUSTOMER_PORTAL_DATA[customer.id];
  return (
    <ActiveROPhoneContent
      customer={customer}
      vehicle={primaryVehicle}
      ro={activeRO}
      portalData={portalData}
    />
  );
}

// ── Standalone Mode: Monica's full mobile portal ────────────

const STANDALONE_STEPS = [
  { label: "Checked In", state: "done" },
  { label: "Diagnosed", state: "done" },
  { label: "Awaiting Approval", state: "current" },
  { label: "Ready", state: "pending" },
];

const STANDALONE_ITEMS = [
  {
    id: "sa-air",
    name: "Engine Air Filter",
    urgency: "URGENT",
    urgencyColor: "#EF4444",
    urgencyBg: "#FEF2F2",
    price: 87,
    detail: "Your engine air filter is 40% clogged — like breathing through a dirty sock. Replacing now improves fuel economy and protects the engine.",
    photoLink: true,
  },
  {
    id: "sa-belt",
    name: "Serpentine Belt",
    urgency: "URGENT",
    urgencyColor: "#EF4444",
    urgencyBg: "#FEF2F2",
    price: 126,
    detail: "Visible cracks on 3 of 6 ribs. If it breaks while driving, you'll lose power steering and the car will stall. $126 now vs $400+ tow.",
    photoLink: false,
  },
  {
    id: "sa-cabin",
    name: "Cabin Air Filter",
    urgency: "SUGGESTED",
    urgencyColor: "#2563EB",
    urgencyBg: "#EFF6FF",
    price: 52,
    detail: "Last replaced 38K miles ago. Affects your A/C quality and air you breathe inside the car.",
    photoLink: false,
  },
];

const ALL_GOOD_ITEMS = [
  "Engine Oil", "Tire Pressure", "Brake Fluid", "Coolant Level",
  "Battery Health", "Wiper Blades", "Headlights", "Tail Lights",
  "Power Steering", "Transmission Fluid", "Exhaust System", "Suspension",
  "Fuel System", "A/C Refrigerant",
];

function StandaloneStepBar({ steps, approved }) {
  const displaySteps = approved
    ? steps.map((s) => s.label === "Awaiting Approval" ? { ...s, state: "done" } : s.label === "Ready" ? { ...s, state: "current" } : s)
    : steps;

  return (
    <div style={{ padding: "14px 16px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        {displaySteps.map((step, idx) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
              {idx < displaySteps.length - 1 && (
                <div style={{ position: "absolute", top: 9, left: "50%", width: "100%", height: 2, background: isDone ? "#22C55E" : "#E5E7EB", zIndex: 0 }} />
              )}
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                background: isDone ? "#22C55E" : isCurrent ? "#FF6B35" : "#E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isCurrent ? "0 0 0 4px rgba(255,107,53,0.2)" : "none",
                marginBottom: 4, position: "relative", zIndex: 1, flexShrink: 0,
              }}>
                {isDone && <CheckCircle size={11} color="#fff" />}
                {isCurrent && <div style={{ width: 7, height: 7, borderRadius: 4, background: "#fff" }} />}
              </div>
              <div style={{ fontSize: 9, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#FF6B35" : isDone ? "#22C55E" : "#9CA3AF", textAlign: "center", lineHeight: 1.2 }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: "#6B7280", textAlign: "center" }}>
        Tech: Marcus Williams · Est. ready: 2:30 PM
      </div>
    </div>
  );
}

function SignatureModal({ onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 420, padding: "24px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0D3B45" }}>Your digital signature</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color="#6B7280" /></button>
        </div>
        <div style={{ background: "#F9FAFB", borderRadius: 12, height: 200, border: "1.5px dashed #D1D5DB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative", overflow: "hidden" }}>
          <svg width="280" height="120" viewBox="0 0 280 120" style={{ position: "absolute" }}>
            <path d="M20,80 C40,60 60,95 80,75 C100,55 115,90 135,70 C155,50 170,85 195,65 C215,48 230,72 255,58" stroke="#0D3B45" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            <path d="M30,95 C50,88 70,98 90,92" stroke="#0D3B45" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
          </svg>
          <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 9, color: "#9CA3AF" }}>Monica Rodriguez</div>
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 16, textAlign: "center" }}>
          I authorize the above repairs and agree to the estimated total.
        </div>
        <button onClick={onConfirm} style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "#FF6B35", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Confirm &amp; Authorize
        </button>
      </div>
    </div>
  );
}

function VideoModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer" }}><X size={24} color="#fff" /></button>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16, textAlign: "center" }}>Video walkaround — recorded during inspection</div>
        <div style={{ background: "#1A1A2E", borderRadius: 16, height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 16, position: "relative" }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: "rgba(255,107,53,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Play size={28} color="#fff" fill="#fff" />
          </div>
          <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>0:00</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>0:47</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "0%", height: "100%", background: "#FF6B35", borderRadius: 2 }} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 20 }}>Tech: Marcus Williams · Today 9:12 AM</div>
        <button style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Share2 size={15} /> Share with family
        </button>
      </div>
    </div>
  );
}

function StandaloneCustomerPortal() {
  const [expandedItem, setExpandedItem] = useState(null);
  const [allGoodExpanded, setAllGoodExpanded] = useState(false);
  const [approvalMode, setApprovalMode] = useState("none"); // "none" | "select"
  const [selectedApprovals, setSelectedApprovals] = useState(new Set(["sa-air", "sa-belt", "sa-cabin"]));
  const [showSignature, setShowSignature] = useState(false);
  const [approved, setApproved] = useState(false);
  const [lyftToggle, setLyftToggle] = useState(false);
  const [smsToggle, setSmsToggle] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const totalAll = STANDALONE_ITEMS.reduce((s, i) => s + i.price, 0);
  const selectedTotal = STANDALONE_ITEMS.filter((i) => selectedApprovals.has(i.id)).reduce((s, i) => s + i.price, 0);

  const toggleItemApproval = (id) => {
    setSelectedApprovals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApproveAll = () => {
    setSelectedApprovals(new Set(STANDALONE_ITEMS.map((i) => i.id)));
    setShowSignature(true);
  };

  const handleApproveSelected = () => {
    setShowSignature(true);
  };

  const handleConfirmSignature = () => {
    setShowSignature(false);
    setApproved(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 0 40px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", minHeight: "100vh", boxShadow: "0 0 40px rgba(0,0,0,0.10)", position: "relative" }}>

        {/* Header */}
        <div style={{ background: "#0D3B45", padding: "20px 20px 16px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Wrench size={14} color="#fff" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.3 }}>WrenchIQ<span style={{ color: "#FF6B35" }}>.ai</span></span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>2021 Toyota Camry SE</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>Monica R. · Peninsula Precision Auto, Palo Alto</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22C55E", boxShadow: "0 0 0 3px rgba(34,197,94,0.25)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Live · updating in real time</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
          <StandaloneStepBar steps={STANDALONE_STEPS} approved={approved} />
        </div>

        {/* Success banner */}
        {approved && (
          <div style={{ background: "#F0FDF4", borderBottom: "1px solid #BBF7D0", padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <CheckCircle size={18} color="#22C55E" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>Approved! Shop has been notified.</span>
            </div>
            <div style={{ fontSize: 12, color: "#16A34A", marginBottom: 10 }}>You'll receive an SMS when your car is ready.</div>
            <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 14px", borderRadius: 10, background: "#FF6000", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", justifyContent: "center" }}>
              <Car size={14} /> Need a ride? Request Lyft
            </button>
          </div>
        )}

        {/* What We Found */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>What We Found</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ background: "#FF6B35", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>3</span>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: "#EF4444" }} />
            </div>
          </div>

          {STANDALONE_ITEMS.map((item) => {
            const isExpanded = expandedItem === item.id;
            return (
              <div key={item.id} style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <button
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: item.urgencyColor, background: item.urgencyBg, padding: "2px 6px", borderRadius: 20, letterSpacing: 0.5, textTransform: "uppercase" }}>{item.urgency}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>${item.price}</span>
                    {isExpanded ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
                  </div>
                </button>
                {isExpanded && (
                  <div style={{ padding: "0 14px 14px" }}>
                    <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, marginBottom: item.photoLink ? 10 : 0 }}>
                      {item.detail}
                    </div>
                    {item.photoLink && (
                      <button style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#0D3B45", fontWeight: 600, cursor: "pointer" }}>
                        View photo
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* All Good section */}
        <div style={{ padding: "4px 16px 12px" }}>
          <button
            onClick={() => setAllGoodExpanded(!allGoodExpanded)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 12, padding: "11px 14px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={16} color="#22C55E" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>All Good (14)</span>
              <span style={{ fontSize: 11, color: "#16A34A" }}>14 items checked — all good</span>
            </div>
            {allGoodExpanded ? <ChevronUp size={15} color="#22C55E" /> : <ChevronDown size={15} color="#22C55E" />}
          </button>
          {allGoodExpanded && (
            <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "12px 14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {ALL_GOOD_ITEMS.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#15803D" }}>
                    <CheckCircle size={11} color="#22C55E" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Estimate + Approval */}
        {!approved && (
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ background: "#0D3B45", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>Total estimate</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 12 }}>${approvalMode === "select" ? selectedTotal : totalAll} total · {approvalMode === "select" ? selectedApprovals.size : 3} items</div>
              <button onClick={handleApproveAll} style={{ width: "100%", padding: "14px 0", borderRadius: 11, background: "#FF6B35", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
                Approve All — ${totalAll}
              </button>
              <button onClick={() => setApprovalMode(approvalMode === "select" ? "none" : "select")} style={{ width: "100%", padding: "11px 0", borderRadius: 11, background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Select individually
              </button>
            </div>

            {approvalMode === "select" && (
              <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                {STANDALONE_ITEMS.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: item.id !== "sa-cabin" ? "1px solid #F3F4F6" : "none" }}>
                    <input
                      type="checkbox"
                      checked={selectedApprovals.has(item.id)}
                      onChange={() => toggleItemApproval(item.id)}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#FF6B35" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>{item.urgency}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>${item.price}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={handleApproveSelected} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "#FF6B35", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Approve Selected
                  </button>
                  <button style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "#fff", border: "1.5px solid #E5E7EB", color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Decline Rest
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pickup options */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Request Lyft when ready</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Auto-schedule a ride at pickup</div>
              </div>
              <button onClick={() => setLyftToggle(!lyftToggle)} style={{ width: 44, height: 24, borderRadius: 12, background: lyftToggle ? "#FF6B35" : "#D1D5DB", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: lyftToggle ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
              </button>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={14} color="#0D3B45" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Notify me when ready</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>SMS to (650) 555-0193</div>
                </div>
              </div>
              <button onClick={() => setSmsToggle(!smsToggle)} style={{ width: 44, height: 24, borderRadius: 12, background: smsToggle ? "#22C55E" : "#D1D5DB", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: smsToggle ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Health Report */}
        <div style={{ padding: "0 16px 32px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Full Inspection Report</div>

          {/* Traffic light summary */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#EF4444" }}>3</div>
              <div style={{ fontSize: 9, color: "#EF4444", fontWeight: 600, marginTop: 2 }}>NEEDS ATTENTION</div>
            </div>
            <div style={{ flex: 1, background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#D97706" }}>0</div>
              <div style={{ fontSize: 9, color: "#D97706", fontWeight: 600, marginTop: 2 }}>MONITOR</div>
            </div>
            <div style={{ flex: 1, background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#22C55E" }}>14</div>
              <div style={{ fontSize: 9, color: "#22C55E", fontWeight: 600, marginTop: 2 }}>ALL GOOD</div>
            </div>
          </div>

          {/* Video walkaround */}
          <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ background: "#1A1A2E", height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "rgba(255,107,53,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={22} color="#fff" fill="#fff" />
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <Video size={10} color="rgba(255,255,255,0.7)" />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>0:47 · Tech walkaround by Marcus W.</span>
              </div>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Video Walkaround</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Recorded during your inspection</div>
              </div>
              <button onClick={() => setShowVideo(true)} style={{ padding: "8px 16px", borderRadius: 8, background: "#0D3B45", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Watch
              </button>
            </div>
          </div>

          {/* Share report */}
          <button style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: "#fff", border: "1.5px solid #E5E7EB", color: "#0D3B45", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Share2 size={15} /> Share report
          </button>
        </div>

        {/* Modals */}
        {showSignature && <SignatureModal onConfirm={handleConfirmSignature} onClose={() => setShowSignature(false)} />}
        {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}
      </div>
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────

export default function CustomerPortalScreen({ standaloneMode = false }) {
  if (standaloneMode) {
    return <StandaloneCustomerPortal />;
  }

  return <CustomerPortalScreenInner />;
}

function CustomerPortalScreenInner() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("cust-003");
  const [chatExpanded, setChatExpanded] = useState(true);
  const [approvedItems, setApprovedItems] = useState(new Set(["svc-air-filter", "svc-serpentine-belt"]));
  const [expandedWhyItem, setExpandedWhyItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeCount = CUSTOMER_ROWS.filter((r) => r.activeRO).length;

  const filteredRows = searchQuery
    ? CUSTOMER_ROWS.filter((r) => {
        const q = searchQuery.toLowerCase();
        const name = `${r.customer.firstName} ${r.customer.lastName}`.toLowerCase();
        const vehicle = r.primaryVehicle ? `${r.primaryVehicle.year} ${r.primaryVehicle.make} ${r.primaryVehicle.model}`.toLowerCase() : "";
        return name.includes(q) || vehicle.includes(q);
      })
    : CUSTOMER_ROWS;

  const selectedRow = CUSTOMER_ROWS.find((r) => r.customer.id === selectedCustomerId) || CUSTOMER_ROWS[0];

  return (
    <div style={{ display: "flex", gap: 0, padding: "24px 24px", background: COLORS.bg, minHeight: "calc(100vh - 64px)", boxSizing: "border-box" }}>

      {/* ── LEFT: Customer List (55%) ── */}
      <div style={{ flex: "0 0 55%", paddingRight: 24, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -0.3 }}>Customer Portal</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "4px 12px" }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: COLORS.success }} />
              <span style={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>{activeCount} active today</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: COLORS.textSecondary }}>
            Select any customer to preview their mobile portal in real-time
          </p>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 10, padding: "8px 12px", border: "1px solid #E5E7EB", marginBottom: 12 }}>
          <User size={14} color={COLORS.textMuted} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers or vehicles…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, flex: 1, color: COLORS.textPrimary }}
          />
        </div>

        {/* Customer rows */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredRows.map(({ customer, primaryVehicle, activeRO, vehicles: custVehicles }, idx) => {
            const isSelected = customer.id === selectedCustomerId;
            const colors = avatarColors(idx);
            const hasActive = !!activeRO;

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                  padding: "12px 14px",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 16px rgba(255,107,53,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
                  transition: "all 0.14s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: isSelected ? COLORS.accent : colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.text, fontSize: 13, fontWeight: 800, flexShrink: 0, transition: "background 0.14s" }}>
                    {customer.firstName[0]}{customer.lastName[0]}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{customer.firstName} {customer.lastName}</span>
                      {hasActive && (
                        <span style={{ fontSize: 9, fontWeight: 700, background: statusColor(activeRO.status) + "1A", color: statusColor(activeRO.status), borderRadius: 20, padding: "2px 7px", letterSpacing: 0.3 }}>
                          {statusLabel(activeRO.status).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {customer.occupation}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {primaryVehicle && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Car size={11} color={COLORS.textMuted} />
                          <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}</span>
                        </div>
                      )}
                      {activeRO && (
                        <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace", background: "#F3F4F6", borderRadius: 4, padding: "1px 5px" }}>
                          {activeRO.id}
                        </span>
                      )}
                      {!activeRO && (
                        <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                          No active RO · {customer.visits} visits
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: progress or LTV + preview indicator */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    {activeRO ? (
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 9.5, color: COLORS.textMuted, marginBottom: 3 }}>Progress</div>
                        <div style={{ width: 60, height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${activeRO.progress}%`, background: activeRO.progress >= 80 ? COLORS.success : activeRO.progress >= 40 ? COLORS.accent : COLORS.primary, borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textPrimary, marginTop: 2 }}>{activeRO.progress}%</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary }}>${customer.ltv?.toLocaleString()}</div>
                        <div style={{ fontSize: 9 }}>lifetime</div>
                      </div>
                    )}
                    {isSelected && (
                      <div style={{ fontSize: 8.5, color: COLORS.accent, fontWeight: 700, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                        <div style={{ width: 5, height: 5, borderRadius: 3, background: COLORS.accent }} /> live →
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info card */}
        <div style={{ marginTop: 14, background: "#EFF6FF", borderRadius: 10, padding: "12px 14px", border: "1px solid #BFDBFE", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <ShieldCheck size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1E40AF", marginBottom: 3 }}>How the Customer Portal works</div>
              <div style={{ fontSize: 11, color: "#3B82F6", lineHeight: 1.6 }}>
                Customers receive a text/email with their portal link. They see real-time progress, AI explanations, and can approve services &amp; pay directly in the portal.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: iPhone Preview (45%) ── */}
      <div style={{ flex: "0 0 45%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Label */}
        <div style={{ marginBottom: 8, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>
            {selectedRow.customer.firstName} {selectedRow.customer.lastName}'s View
          </div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
            {selectedRow.activeRO
              ? `${selectedRow.primaryVehicle ? `${selectedRow.primaryVehicle.year} ${selectedRow.primaryVehicle.make} ${selectedRow.primaryVehicle.model}` : ""} · ${selectedRow.activeRO.id}`
              : selectedRow.primaryVehicle
              ? `${selectedRow.primaryVehicle.year} ${selectedRow.primaryVehicle.make} ${selectedRow.primaryVehicle.model} · No active service`
              : "No active service"}
          </div>
        </div>

        <IPhoneFrame scale={0.78}>
          <PhoneContent
            row={selectedRow}
            approvedItems={approvedItems}
            setApprovedItems={setApprovedItems}
            expandedWhyItem={expandedWhyItem}
            setExpandedWhyItem={setExpandedWhyItem}
            chatExpanded={chatExpanded}
            setChatExpanded={setChatExpanded}
          />
        </IPhoneFrame>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(255,107,53,0.2); }
          50% { box-shadow: 0 0 0 8px rgba(255,107,53,0.08); }
        }
      `}</style>
    </div>
  );
}
