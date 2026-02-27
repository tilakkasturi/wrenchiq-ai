import { useState } from "react";
import {
  Brain,
  Send,
  ChevronDown,
  ChevronRight,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  User,
  Wrench,
  MessageSquare,
  Zap,
  TrendingUp,
  AlertCircle,
  Shield,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import {
  customers,
  vehicles,
  repairOrders,
  getCustomer,
  getVehicle,
  SHOP,
} from "../data/demoData";
import { getTSBsForVehicle } from "../data/tsbData";

// ── Data references ─────────────────────────────────────────
const davidKim = getCustomer("cust-002");
const davidVehicle = getVehicle("veh-003");
const davidRO = repairOrders.find((ro) => ro.id === "RO-2024-1188");
const davidTSBs = getTSBsForVehicle("Honda", "CR-V", 2019);

// ── Repair history for David Kim ────────────────────────────
const davidRepairHistory = [
  { date: "Jul 2024", service: "Oil Change + Tire Rotation", amount: "$142" },
  { date: "Jan 2024", service: "75K Major Service + Air Filter", amount: "$890" },
  { date: "Aug 2023", service: "Front Brake Pads + Rotors", amount: "$685" },
];

// ── Chat messages ────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "user",
    text: "David Kim is here with his CR-V. Check engine light is on, code P0420. He's also due for 90K service. What should I know?",
    timestamp: "9:04 AM",
  },
  {
    id: 2,
    role: "ai",
    timestamp: "9:04 AM",
    reasoning: [
      "Analyzing VIN 5J6RW2H85KA014928... 2019 Honda CR-V EX-L, 1.5L Turbo, 87,400 miles",
      "Cross-referencing NHTSA TSB database... Found TSB-19-052: 1.5T oil dilution issue affecting 2017–2020 CR-V models",
      "Checking extended warranty: Honda offered 6yr/80K for engine/transmission related to TSB-19-052. Vehicle is at 6.5yr/87.4K — just outside coverage window",
      "P0420 = catalytic converter efficiency below threshold. Common on 1.5T due to oil dilution contaminating catalyst over time",
      "Searching parts database for catalytic converter options... Walker 16468 flagged as best-value based on 12 prior installs at Peninsula Precision with zero returns",
      "Pulling customer profile for cust-002 (David Kim)... 9 visits, $5,230 LTV, price-conscious, approves when given detailed technical reasoning",
    ],
    sections: [
      {
        type: "alert",
        severity: "critical",
        title: "Critical: TSB-19-052 Applies",
        body: "The 1.5L turbo has a known oil dilution issue (fuel mixing with engine oil). This is likely the root cause of the P0420 code — contaminated oil damages the catalytic converter over time.",
      },
      {
        type: "warranty",
        title: "Warranty Status",
        body: "Honda extended coverage to 6yr/80K miles. David's at 87.4K miles and ~6.5 years — just outside the window. I recommend calling Honda Customer Relations at 1-800-999-1009 to request a goodwill extension. Success rate is ~40% when you reference the TSB number.",
      },
      {
        type: "parts",
        title: "Parts Recommendation",
        body: "If goodwill claim is denied, the Walker 16468 is the best value:",
        parts: [
          { label: "Walker 16468", detail: "$342 (O'Reilly, same-day) or $298 (eBay Motors, 2–3 days)", badge: "Best Value" },
          { label: "vs Honda OEM", detail: "$890 (backordered 7–10 days)", badge: "OEM" },
          { label: "Walker track record", detail: "4.7★ rating, 12 installs at our shop with zero returns", badge: null },
        ],
      },
      {
        type: "checklist",
        title: "90K Service Checklist",
        subtitle: "Since David's here anyway, bundle the 90K service for efficiency:",
        items: [
          { label: "CVT Fluid Exchange", price: "$290", note: "critical at 90K for Honda CVT", done: true },
          { label: "Spark Plugs", price: "$263", note: "original set, due at 90K per Honda", done: true },
          { label: "Brake Fluid Flush", price: "$115.50", note: "last done at 60K", done: true },
          { label: "Coolant Flush", price: "$188", note: "recommended at 90K", done: true },
          { label: "Multi-Point Inspection", price: "included", note: "", done: true },
        ],
      },
      {
        type: "total",
        label: "Total Estimate",
        amount: "$2,190",
        note: "if catalytic converter needed + 90K service",
      },
    ],
  },
  {
    id: 3,
    role: "user",
    text: "What's David's history with us? Is he likely to approve?",
    timestamp: "9:07 AM",
  },
  {
    id: 4,
    role: "ai",
    timestamp: "9:07 AM",
    reasoning: [
      "Pulling full customer record for David Kim (cust-002)...",
      "Cross-referencing all repair orders... 9 visits since July 2020, $5,230 lifetime value",
      "Analyzing approval patterns from historical ROs... David approved 6 of 9 service recommendations, declined 3 (all were purely cosmetic or convenience items)",
      "Customer notes: price-conscious, likes detailed explanations, commutes to Mountain View — vehicle reliability matters",
      "Calculating approval probability based on: estimated value vs. vehicle age, how we frame the TSB, goodwill claim leverage...",
    ],
    sections: [
      {
        type: "profile",
        title: "David Kim — Customer Profile",
        stats: [
          { label: "Visits since July 2020", value: "9" },
          { label: "Lifetime value", value: "$5,230" },
          { label: "Rating", value: "4/5" },
          { label: "Key trait", value: "Price-conscious, likes detailed explanations" },
        ],
      },
      {
        type: "prediction",
        title: "Approval Prediction",
        probability: 65,
        label: "Medium likelihood",
        recommendations: [
          "Show him the TSB document — it builds credibility",
          "Lead with the goodwill claim attempt — shows we're on his side",
          "Present the 90K service as a bundle discount vs. separate visits",
          "Use the eBay Motors pricing for the catalytic converter to keep costs down",
        ],
      },
      {
        type: "draft_text",
        title: "Draft text message for David:",
        message:
          "Hi David, we've completed the initial diagnosis on your CR-V. The check engine light is related to a known Honda issue (TSB-19-052). Good news — we're going to try getting Honda to cover it under goodwill warranty. We also have your 90K service ready. I'll have a full estimate for you within the hour. - Peninsula Precision Auto",
      },
    ],
  },
  {
    id: 5,
    role: "user",
    text: "Send that text",
    timestamp: "9:09 AM",
  },
  {
    id: 6,
    role: "ai",
    timestamp: "9:09 AM",
    simple: true,
    text: "Text sent to David Kim at (408) 555-0198. I've also flagged his file with the TSB reference for the goodwill claim call.",
    icon: "check",
  },
];

const SUGGESTION_PILLS = [
  "Check Sarah Chen's Mercedes service history",
  "Draft estimate for James Park's BMW",
  "What parts are on backorder?",
  "Show me today's revenue breakdown",
  "Compare parts margins this week vs last",
  "Any upcoming OEM service milestones?",
];

// ── Sub-components ───────────────────────────────────────────

function ReasoningBlock({ steps }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        marginBottom: 14,
        border: "1px solid #E0ECF0",
        borderRadius: 10,
        overflow: "hidden",
        background: "#F4F9FA",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
          }}
        >
          <Brain size={13} color={COLORS.primary} />
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Sonnet 4.6 Reasoning
          </span>
          <span
            style={{
              fontSize: 10,
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 4,
              padding: "1px 6px",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {steps.length} steps
          </span>
        </div>
        {open ? (
          <ChevronDown size={14} color={COLORS.textMuted} />
        ) : (
          <ChevronRight size={14} color={COLORS.textMuted} />
        )}
      </button>
      {open && (
        <div style={{ padding: "2px 14px 12px 14px" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 8,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: COLORS.primary,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: "#2D5A66", lineHeight: 1.55 }}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIMessageContent({ msg }) {
  if (msg.simple) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {msg.icon === "check" && (
          <CheckCircle size={16} color={COLORS.success} style={{ marginTop: 2, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 1.6 }}>{msg.text}</span>
      </div>
    );
  }

  return (
    <div>
      {msg.reasoning && <ReasoningBlock steps={msg.reasoning} />}
      {msg.sections &&
        msg.sections.map((section, si) => {
          if (section.type === "alert") {
            return (
              <div
                key={si}
                style={{
                  background: "#FFF1F0",
                  border: "1px solid #FECACA",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <AlertTriangle size={14} color="#EF4444" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>
                    {section.title}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6, margin: 0 }}>
                  {section.body}
                </p>
              </div>
            );
          }

          if (section.type === "warranty") {
            return (
              <div
                key={si}
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Shield size={14} color="#F59E0B" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>
                    {section.title}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6, margin: 0 }}>
                  {section.body}
                </p>
              </div>
            );
          }

          if (section.type === "parts") {
            return (
              <div key={si} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>
                  {section.title}
                </div>
                <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, margin: "0 0 8px 0" }}>
                  {section.body}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {section.parts.map((p, pi) => (
                    <div
                      key={pi}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: pi === 0 ? "#F0FDF4" : "#F9FAFB",
                        border: pi === 0 ? "1px solid #BBF7D0" : "1px solid #E5E7EB",
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                          {p.label}
                        </span>
                        {p.badge && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              fontWeight: 700,
                              background: pi === 0 ? COLORS.success : "#9CA3AF",
                              color: "#fff",
                              borderRadius: 4,
                              padding: "1px 6px",
                            }}
                          >
                            {p.badge}
                          </span>
                        )}
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                          {p.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.type === "checklist") {
            return (
              <div key={si} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
                  {section.title}
                </div>
                {section.subtitle && (
                  <p style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, margin: "0 0 8px 0" }}>
                    {section.subtitle}
                  </p>
                )}
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {section.items.map((item, ii) => (
                    <div
                      key={ii}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderBottom: ii < section.items.length - 1 ? "1px solid #E5E7EB" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle size={14} color={COLORS.success} />
                        <div>
                          <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.label}</span>
                          {item.note && (
                            <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 6 }}>
                              — {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: item.price === "included" ? COLORS.textMuted : COLORS.textPrimary,
                        }}
                      >
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.type === "total") {
            return (
              <div
                key={si}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: COLORS.primary,
                  borderRadius: 10,
                  marginBottom: 4,
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{section.label}</span>
                  {section.note && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                      {section.note}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{section.amount}</span>
              </div>
            );
          }

          if (section.type === "profile") {
            return (
              <div key={si} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>
                  {section.title}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {section.stats.map((stat, sti) => (
                    <div
                      key={sti}
                      style={{
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        padding: "8px 10px",
                        gridColumn: sti === section.stats.length - 1 && section.stats.length % 2 !== 0 ? "span 2" : "auto",
                      }}
                    >
                      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.type === "prediction") {
            return (
              <div key={si} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>
                  {section.title}
                </div>
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: section.probability >= 70 ? COLORS.success : section.probability >= 50 ? COLORS.warning : COLORS.danger,
                      }}
                    >
                      {section.probability}%
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{section.label}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>approval probability</div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "#E5E7EB",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${section.probability}%`,
                        background: section.probability >= 70 ? COLORS.success : section.probability >= 50 ? COLORS.warning : COLORS.danger,
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>
                  Recommended approach:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {section.recommendations.map((rec, ri) => (
                    <div
                      key={ri}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 13,
                        color: COLORS.textPrimary,
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: COLORS.accent,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {ri + 1}
                      </span>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.type === "draft_text") {
            return (
              <div key={si} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>
                  {section.title}
                </div>
                <div
                  style={{
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <MessageSquare size={14} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: "#0C4A6E", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                      "{section.message}"
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
    </div>
  );
}

function StarRating({ rating, max = 5 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < rating ? COLORS.warning : "none"}
          color={i < rating ? COLORS.warning : "#D1D5DB"}
        />
      ))}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    high: { bg: "#FEE2E2", color: "#DC2626", label: "High" },
    moderate: { bg: "#FEF3C7", color: "#B45309", label: "Moderate" },
    low: { bg: "#DCFCE7", color: "#16A34A", label: "Low" },
  };
  const s = map[severity] || map.moderate;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        borderRadius: 4,
        padding: "2px 7px",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {s.label}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AICopilotScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    const userMsg = {
      id: messages.length + 1,
      role: "user",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    const aiReply = {
      id: messages.length + 2,
      role: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      simple: true,
      text: "I'm analyzing that now. Give me a moment to pull the relevant data...",
      icon: null,
    };
    setMessages((prev) => [...prev, userMsg, aiReply]);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        background: COLORS.bg,
        overflow: "hidden",
      }}
    >
      {/* ── LEFT PANEL: Chat (65%) ──────────────────────────── */}
      <div
        style={{
          width: "65%",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid " + COLORS.border,
          background: "#FAFAFA",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid " + COLORS.border,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "linear-gradient(135deg, " + COLORS.primary + ", #1A5C6B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Brain size={20} color={COLORS.accent} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
              WrenchIQ AI Copilot
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: COLORS.success,
                  display: "inline-block",
                }}
              />
              Powered by Claude Sonnet 4.6 &mdash; connected to repair history, OEM data &amp; parts catalog
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: COLORS.primary,
                color: "#fff",
                borderRadius: 6,
                padding: "4px 10px",
                letterSpacing: "0.04em",
              }}
            >
              RO-2024-1188
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {/* Avatar */}
                {!isUser && (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, " + COLORS.primary + ", #1A5C6B)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Brain size={17} color={COLORS.accent} />
                  </div>
                )}
                {isUser && (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "#E5E7EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                    }}
                  >
                    TK
                  </div>
                )}

                {/* Bubble */}
                <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 4 }}>
                  {/* AI badge + timestamp row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isUser && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "linear-gradient(90deg, " + COLORS.primary + ", #1A5C6B)",
                          color: "#fff",
                          borderRadius: 4,
                          padding: "2px 7px",
                          letterSpacing: "0.04em",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Zap size={9} />
                        SONNET 4.6
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{msg.timestamp}</span>
                  </div>

                  <div
                    style={{
                      padding: isUser ? "12px 16px" : "14px 16px",
                      borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                      background: isUser ? COLORS.primary : "#fff",
                      color: isUser ? "#fff" : COLORS.textPrimary,
                      border: isUser ? "none" : "1px solid " + COLORS.border,
                      boxShadow: isUser
                        ? "0 2px 6px rgba(13,59,69,0.25)"
                        : "0 1px 4px rgba(0,0,0,0.05)",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {isUser ? (
                      <span>{msg.text}</span>
                    ) : (
                      <AIMessageContent msg={msg} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestion pills */}
        <div
          style={{
            padding: "8px 24px 6px",
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            borderTop: "1px solid " + COLORS.borderLight,
            background: "#fff",
          }}
        >
          {SUGGESTION_PILLS.map((pill, i) => (
            <button
              key={i}
              onClick={() => setInput(pill)}
              style={{
                fontSize: 12,
                padding: "5px 13px",
                borderRadius: 20,
                border: "1px solid " + COLORS.border,
                background: "#FAFAFA",
                color: COLORS.textSecondary,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div
          style={{
            padding: "12px 24px 18px",
            background: "#fff",
            borderTop: "1px solid " + COLORS.border,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: COLORS.bg,
              borderRadius: 14,
              padding: "10px 14px",
              border: "1px solid " + COLORS.border,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask WrenchIQ anything — repair data, estimates, scheduling, parts, customer history..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                background: "transparent",
                color: COLORS.textPrimary,
              }}
            />
            <button
              onClick={handleSend}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: COLORS.accent,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>
          <div
            style={{
              fontSize: 11,
              color: COLORS.textMuted,
              marginTop: 7,
              textAlign: "center",
            }}
          >
            WrenchIQ AI has access to your repair history, OEM data, parts catalogs, and customer records.
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Context sidebar (35%) ─────────────── */}
      <div
        style={{
          width: "35%",
          background: "#fff",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: "16px 18px",
            background: COLORS.primary,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            Active Context
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
            RO-2024-1188 &mdash; David Kim &mdash; 2019 Honda CR-V EX-L
          </div>
        </div>

        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Vehicle Card */}
          <div
            style={{
              background: "#F8FAFB",
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: COLORS.primary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Car size={14} color={COLORS.accent} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Vehicle</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
                {davidVehicle.year} {davidVehicle.make} {davidVehicle.model} {davidVehicle.trim}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  background: COLORS.bg,
                  border: "1px solid " + COLORS.border,
                  borderRadius: 6,
                  padding: "4px 8px",
                  marginBottom: 10,
                  letterSpacing: "0.05em",
                }}
              >
                VIN: {davidVehicle.vin}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  { label: "Mileage", value: davidVehicle.mileage.toLocaleString() + " mi" },
                  { label: "Engine", value: davidVehicle.engine },
                  { label: "Color", value: davidVehicle.color },
                  { label: "Transmission", value: davidVehicle.transmission },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginTop: 1 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Card */}
          <div
            style={{
              background: "#F8FAFB",
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: COLORS.primary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <User size={14} color={COLORS.accent} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Customer</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, " + COLORS.primary + " 0%, #1A5C6B 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  DK
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
                    {davidKim.firstName} {davidKim.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{davidKim.occupation}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>Phone</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{davidKim.phone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>Email</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{davidKim.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>Customer since</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>July 2020</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    paddingTop: 6,
                    borderTop: "1px solid " + COLORS.borderLight,
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: COLORS.textMuted }}>Lifetime visits</span>
                  <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>{davidKim.visits}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>Lifetime value</span>
                  <span style={{ fontWeight: 700, color: COLORS.success, fontSize: 14 }}>
                    ${davidKim.ltv.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>Rating</span>
                  <StarRating rating={davidKim.rating} />
                </div>
              </div>
              {davidKim.notes && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "#78350F",
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Note: </span>{davidKim.notes}
                </div>
              )}
            </div>
          </div>

          {/* Repair History */}
          <div
            style={{
              background: "#F8FAFB",
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: COLORS.primary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Wrench size={14} color={COLORS.accent} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Repair History</span>
            </div>
            <div style={{ padding: "10px 14px" }}>
              {davidRepairHistory.map((visit, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom: i < davidRepairHistory.length - 1 ? "1px solid " + COLORS.borderLight : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>
                      <Clock size={10} style={{ marginRight: 4 }} />
                      {visit.date}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textPrimary }}>{visit.service}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, flexShrink: 0, marginLeft: 12 }}>
                    {visit.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active TSBs */}
          <div
            style={{
              background: "#F8FAFB",
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "#7F1D1D",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color="#FCA5A5" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Active TSBs</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#EF4444",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "1px 8px",
                }}
              >
                {davidTSBs.length}
              </span>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {davidTSBs.map((tsb, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: tsb.severity === "high" ? "#FFF1F0" : "#FFFBEB",
                    border: "1px solid " + (tsb.severity === "high" ? "#FECACA" : "#FDE68A"),
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: COLORS.textPrimary,
                      }}
                    >
                      {tsb.bulletinNumber}
                    </span>
                    <SeverityBadge severity={tsb.severity} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 4, lineHeight: 1.4 }}>
                    {tsb.title}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                    {tsb.description.length > 120
                      ? tsb.description.slice(0, 120) + "..."
                      : tsb.description}
                  </div>
                  {tsb.extendedWarranty && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: "#7C3AED",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Shield size={11} />
                      Extended warranty: {tsb.extendedWarranty.years}yr / {(tsb.extendedWarranty.miles / 1000).toFixed(0)}K mi
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Predictions */}
          <div
            style={{
              background: "#F8FAFB",
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TrendingUp size={14} color="#C4B5FD" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>AI Predictions</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: 4,
                  padding: "2px 7px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Zap size={9} />
                SONNET 4.6
              </span>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  icon: "check",
                  color: COLORS.success,
                  bg: "#F0FDF4",
                  border: "#BBF7D0",
                  text: "Next recommended: CVT Fluid Exchange at 90K",
                  sub: "Included in current RO — addressed today",
                },
                {
                  icon: "clock",
                  color: COLORS.warning,
                  bg: "#FFFBEB",
                  border: "#FDE68A",
                  text: "Upcoming: Timing belt at 105K (~18 months)",
                  sub: "Schedule proactively — ~$680 estimate",
                },
                {
                  icon: "alert",
                  color: "#8B5CF6",
                  bg: "#F5F3FF",
                  border: "#DDD6FE",
                  text: "Watch: CVT judder may develop",
                  sub: "Monitor after fluid change — if shudder persists, valve body may be needed (~$1,200)",
                },
              ].map((pred, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "9px 10px",
                    background: pred.bg,
                    border: "1px solid " + pred.border,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    {pred.icon === "check" && <CheckCircle size={15} color={pred.color} />}
                    {pred.icon === "clock" && <Clock size={15} color={pred.color} />}
                    {pred.icon === "alert" && <AlertCircle size={15} color={pred.color} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.4 }}>
                      {pred.text}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.4 }}>
                      {pred.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
