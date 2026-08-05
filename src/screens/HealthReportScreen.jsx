import { useState } from "react";
import {
  CheckCircle, AlertTriangle, XCircle, Camera, Play, ChevronRight,
  Shield, Clock, DollarSign, Zap, Car, Phone, MessageSquare,
  Star, ArrowRight, User, FileText, Check, X, Calendar, Receipt, Ban,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import AIInsightsStrip from "../components/AIInsightsStrip";

// ─── Inspection Items ─────────────────────────────────────────
const INSPECTION_SECTIONS = [
  {
    id: "safety",
    label: "Safety",
    icon: Shield,
    color: "#EF4444",
    items: [
      {
        id: "brakes-front",
        name: "Front Brake Pads",
        status: "red",
        techNote: "Front brake pads at 2mm — minimum safe thickness is 3mm",
        customerNote: "Your front brake pads are worn to the point where continuing to drive risks damage to your rotors. Replacing now saves up to $400 compared to waiting.",
        measurement: "2mm remaining (min 3mm)",
        photo: true,
        video: true,
        estimateLabel: "Replace Front Pads + Inspect Rotors",
        estimateLow: 287,
        estimateHigh: 420,
        urgency: "Now",
        dealerPrice: 520,
        approved: null,
      },
      {
        id: "tires",
        name: "Tire Tread Depth",
        status: "yellow",
        techNote: "Left rear tire at 3/32\". Others are 6/32\"–7/32\".",
        customerNote: "Your rear left tire is getting thin — about 8,000 miles of life left depending on how you drive. We recommend watching it at your next visit.",
        measurement: "L-Rear: 3/32\" (others 6–7/32\")",
        photo: true,
        video: false,
        estimateLabel: "Tire Replacement (when ready)",
        estimateLow: 129,
        estimateHigh: 189,
        urgency: "Next Visit",
        dealerPrice: 210,
        approved: null,
      },
    ],
  },
  {
    id: "engine",
    label: "Engine & Drivetrain",
    icon: Car,
    color: "#F97316",
    items: [
      {
        id: "oil",
        name: "Engine Oil",
        status: "green",
        techNote: "Full synthetic changed 2,100 miles ago. Color and level good.",
        customerNote: "Your oil looks great — changed recently and in excellent condition. No action needed.",
        measurement: "Full synthetic — 2,100 mi since change",
        photo: false,
        video: false,
        estimateLabel: null,
        urgency: "Good",
        dealerPrice: null,
        approved: null,
      },
      {
        id: "air-filter",
        name: "Engine Air Filter",
        status: "yellow",
        techNote: "Filter shows significant debris accumulation. Recommend replacement.",
        customerNote: "Your air filter is dirty — it's like trying to breathe through a dusty cloth. A clean filter improves fuel economy and protects the engine.",
        measurement: "Moderate-heavy debris",
        photo: true,
        video: false,
        estimateLabel: "Engine Air Filter Replacement",
        estimateLow: 38,
        estimateHigh: 58,
        urgency: "Soon",
        dealerPrice: 89,
        approved: null,
      },
      {
        id: "battery",
        name: "Battery",
        status: "green",
        techNote: "Battery tested at 78% CCA. Load test passed.",
        customerNote: "Battery is healthy — tested at 78% of original capacity. Typically good for another 1–2 years.",
        measurement: "78% CCA — 590A (spec: 630A)",
        photo: false,
        video: false,
        estimateLabel: null,
        urgency: "Good",
        dealerPrice: null,
        approved: null,
      },
    ],
  },
  {
    id: "fluids",
    label: "Fluids",
    icon: CheckCircle,
    color: "#3B82F6",
    items: [
      {
        id: "coolant",
        name: "Coolant / Antifreeze",
        status: "green",
        techNote: "Freeze point at -34°F. Color normal. No contamination.",
        customerNote: "Coolant is in great shape — protects your engine down to -34°F and no signs of contamination.",
        measurement: "-34°F freeze point — clean",
        photo: false,
        video: false,
        estimateLabel: null,
        urgency: "Good",
        dealerPrice: null,
        approved: null,
      },
      {
        id: "brake-fluid",
        name: "Brake Fluid",
        status: "yellow",
        techNote: "Moisture content at 3.1% — approaching service interval of 3.5%.",
        customerNote: "Brake fluid absorbs moisture over time, which lowers its boiling point. Yours is at 3.1% — when it hits 3.5% we recommend flushing. Worth doing with the brake job.",
        measurement: "3.1% moisture (service at 3.5%)",
        photo: false,
        video: false,
        estimateLabel: "Brake Fluid Flush",
        estimateLow: 89,
        estimateHigh: 109,
        urgency: "Bundle with Brakes",
        dealerPrice: 149,
        approved: null,
      },
    ],
  },
];

const STATUS_CONFIG = {
  red: { color: "#EF4444", bg: "#FEF2F2", label: "Needs Attention", icon: XCircle },
  yellow: { color: "#F59E0B", bg: "#FFFBEB", label: "Watch", icon: AlertTriangle },
  green: { color: "#059669", bg: "#ECFDF5", label: "Good", icon: CheckCircle },
};

// ─── Video Placeholder ────────────────────────────────────────
function VideoThumb({ label }) {
  const [played, setPlayed] = useState(false);
  return (
    <div
      onClick={() => setPlayed(!played)}
      style={{ background: played ? "#0D3B45" : "#1A1A2E", borderRadius: 10, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden", minHeight: 90 }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0D3B45 0%, #0D1117 100%)", opacity: 0.9 }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", backdropFilter: "blur(4px)" }}>
          {played ? <Check size={18} color="#fff" /> : <Play size={18} color="#fff" style={{ marginLeft: 2 }} />}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{played ? "Playing..." : label}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>DeShawn W. · 0:47</div>
      </div>
    </div>
  );
}

// ─── Resolution Surface (Schedule / Quote / Decline) ───────────
const DECLINE_REASONS = [
  "Cost — will revisit later",
  "Getting it done elsewhere",
  "Not needed right now",
  "Need to check with owner/spouse",
  "Other",
];

function ResolutionPanel({ item, resolution, onSchedule, onQuote, onDecline }) {
  const [openAction, setOpenAction] = useState(null); // "schedule" | "quote" | "decline" | null
  const [dateValue, setDateValue] = useState("");
  const [declineReason, setDeclineReason] = useState(DECLINE_REASONS[0]);
  const [declineNote, setDeclineNote] = useState("");

  const toggle = (action) => setOpenAction(prev => (prev === action ? null : action));

  const confirmSchedule = () => {
    if (!dateValue) return;
    onSchedule(item.id, dateValue);
    setOpenAction(null);
  };

  const confirmDecline = () => {
    onDecline(item.id, declineReason, declineNote);
    setOpenAction(null);
  };

  const handleQuote = () => {
    onQuote(item.id);
    toggle("quote");
  };

  // Resolved state — show a compact status chip instead of the action row
  if (resolution?.type) {
    const chip = {
      scheduled: { bg: "#EFF6FF", color: "#2563EB", icon: Calendar, text: `Scheduled for ${resolution.date}` },
      quoted: { bg: "#F5F3FF", color: "#7C3AED", icon: Receipt, text: `Quoted: $${item.estimateLow}–${item.estimateHigh}` },
      declined: { bg: "#F9FAFB", color: "#6B7280", icon: Ban, text: `Declined — ${resolution.reason}` },
    }[resolution.type];

    return (
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: chip.bg, borderRadius: 10, padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <chip.icon size={14} color={chip.color} />
          <div style={{ fontSize: 12, fontWeight: 600, color: chip.color }}>{chip.text}</div>
        </div>
        <button
          onClick={() => onDecline(item.id, null, null, /* clear */ true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: COLORS.textMuted, textDecoration: "underline" }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        Resolve this item
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => toggle("schedule")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", borderRadius: 8, border: `1px solid ${openAction === "schedule" ? COLORS.accent : "#E5E7EB"}`, background: openAction === "schedule" ? "#FFF7ED" : "#fff", color: COLORS.textPrimary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <Calendar size={13} /> Schedule
        </button>
        <button
          onClick={handleQuote}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", borderRadius: 8, border: `1px solid ${openAction === "quote" ? "#7C3AED" : "#E5E7EB"}`, background: openAction === "quote" ? "#F5F3FF" : "#fff", color: COLORS.textPrimary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <Receipt size={13} /> Quote
        </button>
        <button
          onClick={() => toggle("decline")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", borderRadius: 8, border: `1px solid ${openAction === "decline" ? "#DC2626" : "#E5E7EB"}`, background: openAction === "decline" ? "#FEF2F2" : "#fff", color: COLORS.textPrimary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <Ban size={13} /> Decline
        </button>
      </div>

      {/* Schedule affordance */}
      {openAction === "schedule" && (
        <div style={{ marginTop: 8, background: "#F9FAFB", borderRadius: 8, padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            style={{ flex: 1, padding: "7px 8px", borderRadius: 6, border: "1px solid #E5E7EB", fontSize: 12 }}
          />
          <button
            onClick={confirmSchedule}
            disabled={!dateValue}
            style={{ padding: "7px 12px", borderRadius: 6, border: "none", background: dateValue ? COLORS.accent : "#D1D5DB", color: "#fff", fontWeight: 700, fontSize: 12, cursor: dateValue ? "pointer" : "not-allowed" }}
          >
            Confirm
          </button>
        </div>
      )}

      {/* Quote breakdown */}
      {openAction === "quote" && (
        <div style={{ marginTop: 8, background: "#F9FAFB", borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: COLORS.textSecondary }}>Estimated range</span>
            <strong>${item.estimateLow}–{item.estimateHigh}</strong>
          </div>
          {item.dealerPrice && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: COLORS.textSecondary }}>Dealer comparison</span>
              <span style={{ textDecoration: "line-through", color: COLORS.textMuted }}>${item.dealerPrice}</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Quote sent to customer portal.</div>
        </div>
      )}

      {/* Decline reason */}
      {openAction === "decline" && (
        <div style={{ marginTop: 8, background: "#F9FAFB", borderRadius: 8, padding: 10 }}>
          <select
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: "1px solid #E5E7EB", fontSize: 12, marginBottom: 6 }}
          >
            {DECLINE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input
            type="text"
            placeholder="Additional note (optional)"
            value={declineNote}
            onChange={(e) => setDeclineNote(e.target.value)}
            style={{ width: "100%", padding: "7px 8px", borderRadius: 6, border: "1px solid #E5E7EB", fontSize: 12, marginBottom: 8, boxSizing: "border-box" }}
          />
          <button
            onClick={confirmDecline}
            style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
          >
            Confirm Decline
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Inspection Item Card ─────────────────────────────────────
function InspectionItem({ item, onToggleApprove, resolution, onSchedule, onQuote, onDecline }) {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.green;
  const [expanded, setExpanded] = useState(item.status === "red");

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${item.status === "red" ? "#FECACA" : item.status === "yellow" ? "#FDE68A" : "#D1FAE5"}`, overflow: "hidden", marginBottom: 10 }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer", background: sc.bg }}
      >
        <sc.icon size={18} color={sc.color} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{item.name}</div>
          <div style={{ fontSize: 12, color: sc.color, fontWeight: 600 }}>{sc.label} · {item.measurement}</div>
        </div>
        {item.estimateLabel && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary }}>${item.estimateLow}–{item.estimateHigh}</div>
            {item.dealerPrice && (
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                <span style={{ textDecoration: "line-through" }}>Dealer: ${item.dealerPrice}</span>
                <span style={{ color: "#059669", fontWeight: 600, marginLeft: 4 }}>Save ${item.dealerPrice - item.estimateHigh}</span>
              </div>
            )}
          </div>
        )}
        <ChevronRight size={16} color={COLORS.textMuted} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${item.status === "red" ? "#FECACA" : "#F3F4F6"}` }}>
          {/* Customer-friendly explanation */}
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
            {item.customerNote}
          </div>

          {/* Tech note */}
          <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", marginBottom: 12, display: "flex", gap: 8 }}>
            <User size={13} color={COLORS.textMuted} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
              <strong>Technician note:</strong> {item.techNote}
            </div>
          </div>

          {/* Photo / Video */}
          {(item.photo || item.video) && (
            <div style={{ display: "grid", gridTemplateColumns: item.video ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 12 }}>
              {item.photo && (
                <div style={{ background: "#F3F4F6", borderRadius: 10, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 90, position: "relative", overflow: "hidden" }}>
                  <Camera size={18} color={COLORS.textMuted} />
                  <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#fff" }}>📷 Photo</div>
                </div>
              )}
              {item.video && <VideoThumb label="Watch inspection video" />}
            </div>
          )}

          {/* Approve / Decline */}
          {item.estimateLabel && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onToggleApprove(item.id, true)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: item.approved === true ? "#059669" : COLORS.accent,
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <CheckCircle size={15} />
                {item.approved === true ? "Approved!" : `Approve — $${item.estimateLow}–${item.estimateHigh}`}
              </button>
              <button
                onClick={() => onToggleApprove(item.id, false)}
                style={{
                  padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E7EB", cursor: "pointer",
                  background: item.approved === false ? "#FEF2F2" : "#F3F4F6",
                  color: item.approved === false ? "#DC2626" : COLORS.textSecondary, fontWeight: 600, fontSize: 13,
                }}
              >
                Not Now
              </button>
            </div>
          )}

          {/* Resolutions surface — concrete next steps instead of a passive flag */}
          {item.estimateLabel && item.status !== "green" && (
            <ResolutionPanel
              item={item}
              resolution={resolution}
              onSchedule={onSchedule}
              onQuote={onQuote}
              onDecline={onDecline}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────
function SummaryBar({ sections, approvals }) {
  const allItems = sections.flatMap(s => s.items);
  const redItems = allItems.filter(i => i.status === "red");
  const yellowItems = allItems.filter(i => i.status === "yellow");
  const greenItems = allItems.filter(i => i.status === "green");
  const approvedItems = Object.entries(approvals).filter(([, v]) => v === true);
  const totalApproved = approvedItems.reduce((sum, [id]) => {
    const item = allItems.find(i => i.id === id);
    return sum + (item?.estimateLow || 0);
  }, 0);

  return (
    <div style={{ background: "linear-gradient(135deg, #0D3B45, #1A5C6B)", borderRadius: 14, padding: "16px 20px", color: "#fff", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444" }}>{redItems.length}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>Needs Attention</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B" }}>{yellowItems.length}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>Watch</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#34D399" }}>{greenItems.length}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>Good</div>
          </div>
        </div>

        <div style={{ flex: 1, borderLeft: "1px solid rgba(255,255,255,0.15)", paddingLeft: 20 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Approved Total</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: approvedItems.length > 0 ? "#34D399" : "rgba(255,255,255,0.5)" }}>
            {approvedItems.length > 0 ? `$${totalApproved}+` : "Nothing approved yet"}
          </div>
          {approvedItems.length > 0 && (
            <div style={{ fontSize: 11, opacity: 0.7 }}>{approvedItems.length} service(s) approved</div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Completed by</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>DeShawn Williams</div>
          <div style={{ display: "flex", gap: 3, justifyContent: "flex-end", marginTop: 3 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={10} color="#F59E0B" fill="#F59E0B" />)}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>ASE Master Tech</div>
        </div>
      </div>
    </div>
  );
}

// ─── Approve All CTA ──────────────────────────────────────────
function ApproveAllCTA({ sections, approvals, onApproveAll }) {
  const allItems = sections.flatMap(s => s.items).filter(i => i.estimateLabel);
  const approved = allItems.filter(i => approvals[i.id] === true);
  const allApproved = approved.length === allItems.length;

  if (allApproved) {
    return (
      <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 14, padding: "20px", textAlign: "center", marginBottom: 20 }}>
        <CheckCircle size={32} color="#059669" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontWeight: 800, fontSize: 18, color: "#059669" }}>All Services Approved!</div>
        <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>Marcus has been notified. We'll text you when your car is ready.</div>
      </div>
    );
  }

  const pendingItems = allItems.filter(i => approvals[i.id] !== true);
  const totalEstimate = pendingItems.reduce((s, i) => s + i.estimateLow, 0);
  const totalDealer = pendingItems.reduce((s, i) => s + (i.dealerPrice || i.estimateHigh), 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Approve {pendingItems.length} Recommended Services</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Starting at <strong>${totalEstimate}</strong> · Saves up to <strong style={{ color: "#059669" }}>${totalDealer - totalEstimate}</strong> vs dealership</div>
        </div>
        <button
          onClick={onApproveAll}
          style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Approve All →
        </button>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function HealthReportScreen() {
  const [approvals, setApprovals] = useState({});
  const [view, setView] = useState("advisor"); // "advisor" | "customer"
  const [resolutions, setResolutions] = useState({}); // itemId -> { type: 'scheduled'|'quoted'|'declined', date?, reason?, note? }

  const handleToggleApprove = (id, value) => {
    setApprovals(prev => ({ ...prev, [id]: value }));
  };

  const handleSchedule = (id, date) => {
    setResolutions(prev => ({ ...prev, [id]: { type: "scheduled", date } }));
  };

  const handleQuote = () => {
    // Quote is informational (view estimated cost) — it intentionally doesn't
    // lock the item into a resolved state, so Schedule/Decline stay available.
  };

  const handleDecline = (id, reason, note, clear = false) => {
    setResolutions(prev => {
      if (clear) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { type: "declined", reason, note } };
    });
  };

  const handleApproveAll = () => {
    const allApproved = {};
    INSPECTION_SECTIONS.flatMap(s => s.items).filter(i => i.estimateLabel).forEach(i => {
      allApproved[i.id] = true;
    });
    setApprovals(allApproved);
  };

  const allItems = INSPECTION_SECTIONS.flatMap(s => s.items);
  const augmentedSections = INSPECTION_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({ ...item, approved: approvals[item.id] ?? null })),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AIInsightsStrip insights={[
        { icon: "⏳", text: "Sarah opened the health report 2× but hasn't approved — send 1-tap approve link via text", action: "Send Approve Link", value: "+$287–420", color: "#F59E0B" },
        { icon: "🎥", text: "DeShawn's brake inspection video is 47s — customers who watch approve 31% more often", action: "Resend with Video", value: "+31% approval", color: "#3B82F6" },
        { icon: "💡", text: "Dealer comparison showing $333 savings is on her report — your strongest close point", action: "View Report", value: "Save $333", color: "#22C55E" },
        { icon: "📱", text: "Portal opened 3 times — customer is engaged, ideal time to call", action: "Call Sarah", value: "High intent", color: "#FF6B35" },
      ]} />
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>
            Digital Vehicle Health Report
          </h1>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            Sarah Chen · 2022 Tesla Model 3 · VIN ...TK3Y0 · 34,200 miles
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Preview as:</div>
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 8, padding: 2 }}>
            {[{ key: "advisor", label: "Advisor" }, { key: "customer", label: "Customer" }].map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: view === v.key ? "#fff" : "transparent", color: view === v.key ? COLORS.textPrimary : COLORS.textMuted, boxShadow: view === v.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {v.label}
              </button>
            ))}
          </div>
          <button style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <MessageSquare size={13} /> Send to Customer
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Main Report */}
        <div>
          <SummaryBar sections={augmentedSections} approvals={approvals} />
          <ApproveAllCTA sections={augmentedSections} approvals={approvals} onApproveAll={handleApproveAll} />

          {augmentedSections.map(section => (
            <div key={section.id} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: section.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <section.icon size={15} color={section.color} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{section.label}</div>
                <div style={{ height: 1, flex: 1, background: "#E5E7EB" }} />
                <div style={{ display: "flex", gap: 6 }}>
                  {["red", "yellow", "green"].map(s => {
                    const count = section.items.filter(i => i.status === s).length;
                    if (!count) return null;
                    return (
                      <div key={s} style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_CONFIG[s].color }} />
                    );
                  })}
                </div>
              </div>
              {section.items.map(item => (
                <InspectionItem
                  key={item.id}
                  item={item}
                  onToggleApprove={handleToggleApprove}
                  resolution={resolutions[item.id]}
                  onSchedule={handleSchedule}
                  onQuote={handleQuote}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Customer View Preview */}
          <div style={{ background: COLORS.primary, borderRadius: 14, padding: "16px", color: "#fff", overflow: "hidden" }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>What Sarah Sees On Her Phone</div>

            {/* Mini iPhone mockup */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px 14px", color: COLORS.textPrimary, maxWidth: 220, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Peninsula Precision Auto</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>Your Car's Health Report</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>2022 Tesla Model 3 · Today</div>
              </div>

              {/* Mini Health Bars */}
              {[
                { label: "Safety", red: 1, yellow: 1, green: 0 },
                { label: "Engine", red: 0, yellow: 1, green: 2 },
                { label: "Fluids", red: 0, yellow: 1, green: 1 },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, width: 48, flexShrink: 0 }}>{s.label}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", display: "flex" }}>
                    {s.red > 0 && <div style={{ flex: s.red, background: "#EF4444" }} />}
                    {s.yellow > 0 && <div style={{ flex: s.yellow, background: "#F59E0B" }} />}
                    {s.green > 0 && <div style={{ flex: s.green, background: "#059669" }} />}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12, background: COLORS.accent, borderRadius: 8, padding: "8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                Review & Approve →
              </div>
              <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: COLORS.textMuted }}>Apple Pay · Google Pay accepted</div>
            </div>
          </div>

          {/* Tech Performance */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Inspection by DeShawn Williams</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#0D3B45", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>DW</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>DeShawn Williams</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>ASE Master Technician · 19 years</div>
                <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={10} color="#F59E0B" fill="#F59E0B" />)}
                  <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 4 }}>4.97 avg</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Inspections", value: "2,847" },
                { label: "Accuracy Rate", value: "99.1%" },
                { label: "Avg Rating", value: "4.97★" },
              ].map((m, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", background: "#F9FAFB", borderRadius: 8, padding: "8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dealer Comparison */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>We vs. Dealership</div>
            {augmentedSections.flatMap(s => s.items).filter(i => i.estimateLabel && i.dealerPrice).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 12, flex: 1 }}>{item.name}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.accent }}>${item.estimateLow}–{item.estimateHigh}</div>
                  <div style={{ fontSize: 10, textDecoration: "line-through", color: COLORS.textMuted }}>Dealer: ${item.dealerPrice}</div>
                </div>
              </div>
            ))}
            <div style={{ background: "#ECFDF5", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>Your savings</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>
                Up to ${augmentedSections.flatMap(s => s.items).filter(i => i.dealerPrice).reduce((sum, i) => sum + (i.dealerPrice - i.estimateLow), 0)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <MessageSquare size={15} /> Text Report to Customer
            </button>
            <button style={{ background: "#F3F4F6", color: COLORS.textSecondary, border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <FileText size={15} /> Export PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
