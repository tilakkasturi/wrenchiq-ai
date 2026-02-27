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
              <div style={{ fontSize: 11, fontWeight: 700 }}>Chat with WrenchIQ AI</div>
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
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#fff" }}>WrenchIQ Assistant</div>
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

// ── Main screen ────────────────────────────────────────────

export default function CustomerPortalScreen() {
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
