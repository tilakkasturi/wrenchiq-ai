import { useState } from "react";
import {
  Instagram, MessageCircle, Star, Clock, Zap, CheckCircle,
  Send, ChevronRight, TrendingUp, Users, Phone, Calendar,
  Heart, ThumbsUp, AlertCircle, Filter, Search, X, Play,
  FileText, Car, User, ArrowRight, Video, Image,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ─── Mock Social Leads Data ───────────────────────────────────
const LEADS = [
  {
    id: "lead-001",
    channel: "instagram",
    channelHandle: "@greatwater360",
    customerName: "Jasmine Torres",
    customerHandle: "@jasminedrives",
    avatar: "JT",
    avatarBg: "#E879A0",
    score: "hot",
    intent: "Brake Service",
    message: "Hey! My car has been making this awful grinding sound when I brake. Is this something you can help with? How much would it cost?",
    timestamp: "9 min ago",
    vehicleGuess: null,
    unread: true,
    dmSource: "story_reply",
    storyThumbnail: { label: "Brake Service Special", caption: "Your story: 'Brake pad replacement starting at $99'" },
    aiDraft: "Hi Jasmine! Grinding when braking usually means your brake pads are worn — it's actually a safety issue we'd want to look at ASAP. The good news: it's one of the most common things we fix. Can you tell me your vehicle year and make? We can give you a rough estimate right now and get you in quickly 🚗",
    thread: [
      { role: "customer", text: "Hey! My car has been making this awful grinding sound when I brake. Is this something you can help with? How much would it cost?", time: "9:14 AM" },
    ],
    conversionStage: "new_lead",
    aiInsight: "Brake grinding = safety urgency. High conversion intent. Typical repair: $280–$620.",
  },
  {
    id: "lead-002",
    channel: "tiktok",
    channelHandle: "@wrenchiqauto",
    customerName: "Marcus Webb",
    customerHandle: "@marcus_drives_rv",
    avatar: "MW",
    avatarBg: "#7C3AED",
    score: "hot",
    intent: "Oil Change + Follow-up",
    message: "Saw your video on synthetic oil myths 🔥 been going to Jiffy Lube for years but they never explain anything. Do you take walk-ins?",
    timestamp: "22 min ago",
    vehicleGuess: null,
    unread: true,
    dmSource: "video_comment",
    sourceVideo: { title: "5 Synthetic Oil Myths Busted", views: "24.3K", likes: "1.8K", caption: "Comment: \"this is exactly what I needed to see\"" },
    aiDraft: "Marcus, so glad the video was helpful! That's exactly why we make them — car care shouldn't be a mystery. We do take walk-ins but weekends fill up fast. What kind of car do you drive? I can check our schedule and get you in this week — first oil change, we'll do a full health scan on us. 🔧",
    thread: [
      { role: "customer", text: "Saw your video on synthetic oil myths 🔥 been going to Jiffy Lube for years but they never explain anything. Do you take walk-ins?", time: "8:51 AM" },
    ],
    conversionStage: "new_lead",
    aiInsight: "TikTok discovery customer. Price-sensitive (Jiffy Lube user). High education appetite. Free inspection offer likely converts.",
  },
  {
    id: "lead-003",
    channel: "instagram",
    channelHandle: "@greatwater360",
    customerName: "Priya Nair",
    customerHandle: "@priya.n.bay",
    avatar: "PN",
    avatarBg: "#0891B2",
    score: "warm",
    intent: "Engine Light / Diagnostic",
    message: "My check engine light came on yesterday and I panicked 😭 my dealer wants $189 just to plug in a scanner. That feels crazy?",
    timestamp: "1 hr ago",
    vehicleGuess: null,
    unread: true,
    dmSource: "direct",
    aiDraft: "Priya, $189 just for a scan is honestly a lot — most shops including us do the initial code pull for free or a low diagnostic fee that applies toward the repair if you decide to fix it with us. What year/make is your vehicle? If it's a common code (like an O2 sensor or gas cap), I might be able to give you an idea before you even come in.",
    thread: [
      { role: "customer", text: "My check engine light came on yesterday and I panicked 😭 my dealer wants $189 just to plug in a scanner. That feels crazy?", time: "8:04 AM" },
    ],
    conversionStage: "new_lead",
    aiInsight: "Dealer defector. Price-conscious but trustworthy. Free diagnostic offer is strong close. Expected RO value: $180–$900.",
  },
  {
    id: "lead-004",
    channel: "google",
    channelHandle: "Google Messages",
    customerName: "Robert Chen",
    customerHandle: "Google Business",
    avatar: "RC",
    avatarBg: "#059669",
    score: "booked",
    intent: "AC Service",
    message: "Is your AC recharge service the $129 I saw on Google? My wife's car has been brutal in the heat.",
    timestamp: "2 hrs ago",
    vehicleGuess: "2020 Toyota RAV4",
    unread: false,
    dmSource: "direct",
    aiDraft: "",
    thread: [
      { role: "customer", text: "Is your AC recharge service the $129 I saw on Google? My wife's car has been brutal in the heat.", time: "7:22 AM" },
      { role: "advisor", text: "Hi Robert! Yes — our AC Performance Check + Recharge starts at $129. If there's a leak we'll let you know before any additional work. What vehicle is this for?", time: "7:31 AM" },
      { role: "customer", text: "2020 Toyota RAV4, around 52K miles", time: "7:45 AM" },
      { role: "advisor", text: "Perfect — RAV4 is straightforward. We have openings Tuesday at 10 AM or Thursday at 2 PM. Which works?", time: "7:51 AM" },
      { role: "customer", text: "Tuesday 10 is great! See you then", time: "7:58 AM" },
    ],
    conversionStage: "booked",
    appointmentDate: "Tue Mar 10 · 10:00 AM",
    roNumber: "RO-2241",
    aiInsight: "Booked! 2020 Toyota RAV4, 52K miles. AC service Tuesday 10 AM. Prep: check refrigerant type (R-134a). No open TSBs on this model year for AC.",
  },
  {
    id: "lead-005",
    channel: "facebook",
    channelHandle: "Facebook Page",
    customerName: "Diana Moss",
    customerHandle: "via Facebook",
    avatar: "DM",
    avatarBg: "#DC2626",
    score: "urgent",
    intent: "Angry Customer",
    message: "I came in last week and now my car is making a noise it wasn't making before. I want to talk to someone immediately.",
    timestamp: "3 hrs ago",
    vehicleGuess: null,
    unread: true,
    dmSource: "direct",
    aiDraft: "Diana, I am so sorry to hear this — that is absolutely not the experience we want for you, and I want to make this right today. Can you call me directly at (650) 555-0192 and ask for the manager? We will get your vehicle back in today at no charge and figure out exactly what's happening. I take full responsibility for this.",
    thread: [
      { role: "customer", text: "I came in last week and now my car is making a noise it wasn't making before. I want to talk to someone immediately.", time: "6:47 AM" },
    ],
    conversionStage: "urgent",
    aiInsight: "Potential Google review risk. Respond within 30 minutes. Check RO history for this customer. Comeback scenario — likely needs senior advisor.",
  },
  {
    id: "lead-006",
    channel: "tiktok",
    channelHandle: "@wrenchiqauto",
    customerName: "Kevin Liu",
    customerHandle: "@kevinliucars",
    avatar: "KL",
    avatarBg: "#F59E0B",
    score: "warm",
    intent: "Pre-Purchase Inspection",
    message: "Great content! I'm buying a used car next week. Do you do pre-purchase inspections? What does that cost?",
    timestamp: "4 hrs ago",
    vehicleGuess: null,
    unread: false,
    dmSource: "video_comment",
    sourceVideo: { title: "Why You NEED a Pre-Purchase Inspection", views: "41.8K", likes: "3.2K", caption: "Comment: \"great content! exactly what I was searching for\"" },
    aiDraft: "",
    thread: [
      { role: "customer", text: "Great content! I'm buying a used car next week. Do you do pre-purchase inspections? What does that cost?", time: "5:30 AM" },
      { role: "advisor", text: "Hi Kevin! Absolutely — pre-purchase inspections are actually one of the most valuable things we do. Ours is a 150-point inspection with a full digital report you can share with the seller. $149 flat fee, takes about 90 minutes. What kind of car are you looking at?", time: "6:12 AM" },
    ],
    conversionStage: "engaged",
    aiInsight: "Warm lead, high education intent. PPI customer often becomes loyal long-term customer if they buy the car. Strong relationship opportunity.",
  },
];

const CHANNEL_CONFIG = {
  instagram: { label: "Instagram", color: "#E1306C", bg: "#FFF0F5", icon: Instagram },
  tiktok: { label: "TikTok", color: "#010101", bg: "#F0F0F0", icon: MessageCircle },
  facebook: { label: "Facebook", color: "#1877F2", bg: "#EBF5FF", icon: MessageCircle },
  google: { label: "Google", color: "#34A853", bg: "#EDFBEF", icon: MessageCircle },
  sms: { label: "SMS", color: "#6B7280", bg: "#F3F4F6", icon: MessageCircle },
};

const SCORE_CONFIG = {
  hot: { label: "Hot Lead", color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444" },
  warm: { label: "Warm", color: "#F97316", bg: "#FFF7ED", dot: "#F97316" },
  urgent: { label: "Urgent", color: "#7C3AED", bg: "#F5F3FF", dot: "#7C3AED" },
  booked: { label: "Booked", color: "#059669", bg: "#ECFDF5", dot: "#059669" },
  cold: { label: "Cold", color: "#6B7280", bg: "#F9FAFB", dot: "#9CA3AF" },
};

const STAGE_CONFIG = {
  new_lead: { label: "New", color: "#EF4444" },
  engaged: { label: "Engaged", color: "#F97316" },
  booked: { label: "Booked", color: "#059669" },
  urgent: { label: "Urgent", color: "#7C3AED" },
  converted: { label: "RO Created", color: "#059669" },
};

// ─── Instagram Story Thread Header ───────────────────────────
function InstagramStoryHeader({ lead }) {
  if (lead.dmSource !== "story_reply" || !lead.storyThumbnail) return null;
  return (
    <div style={{
      margin: "0 20px 12px",
      borderRadius: 10,
      overflow: "hidden",
      border: "1.5px solid #E1306C40",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <Instagram size={13} color="#fff" />
        <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>Story Reply</span>
      </div>
      <div style={{ background: "#FFF0F5", padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #833AB4, #E1306C)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Image size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#833AB4" }}>{lead.storyThumbnail.label}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{lead.storyThumbnail.caption}</div>
        </div>
      </div>
    </div>
  );
}

// ─── TikTok Video Source Header ───────────────────────────────
function TikTokVideoHeader({ lead }) {
  if (lead.dmSource !== "video_comment" || lead.channel !== "tiktok" || !lead.sourceVideo) return null;
  return (
    <div style={{
      margin: "0 20px 12px",
      borderRadius: 10,
      overflow: "hidden",
      border: "1.5px solid #01010120",
    }}>
      <div style={{
        background: "#010101",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <Video size={13} color="#fff" />
        <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>From TikTok Video</span>
      </div>
      <div style={{ background: "#F8F8F8", padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: "#010101",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <Play size={18} color="#fff" />
          <div style={{ position: "absolute", bottom: 2, right: 2, background: "#FE2C55", borderRadius: 3, width: 6, height: 6 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#010101" }}>{lead.sourceVideo.title}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{lead.sourceVideo.views} views</span>
            <span style={{ fontSize: 11, color: "#FE2C55" }}>{lead.sourceVideo.likes} likes</span>
          </div>
          <div style={{ fontSize: 11, color: "#374151", marginTop: 2, fontStyle: "italic" }}>{lead.sourceVideo.caption}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { label: "New Leads Today", value: "7", trend: "+3", icon: Users, color: COLORS.accent },
    { label: "Avg Response Time", value: "4m", trend: "-2m", icon: Clock, color: "#3B82F6" },
    { label: "Conversion Rate", value: "61%", trend: "+8%", icon: TrendingUp, color: "#059669" },
    { label: "Booked This Week", value: "$4,820", trend: "from social", icon: Calendar, color: "#8B5CF6" },
  ];
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <s.icon size={18} color={s.color} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>{s.trend}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────
function LeadCard({ lead, selected, onClick }) {
  const ch = CHANNEL_CONFIG[lead.channel] || CHANNEL_CONFIG.sms;
  const sc = SCORE_CONFIG[lead.score] || SCORE_CONFIG.cold;
  const stage = STAGE_CONFIG[lead.conversionStage] || STAGE_CONFIG.new_lead;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        cursor: "pointer",
        background: selected ? "#FFF7F5" : lead.unread ? "#FAFAFA" : "#fff",
        borderLeft: selected ? `3px solid ${COLORS.accent}` : lead.unread ? `3px solid ${sc.dot}` : "3px solid transparent",
        transition: "background 0.1s",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: lead.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {lead.avatar}
          </div>
          <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 4, background: ch.bg, border: "1.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ch.icon size={8} color={ch.color} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <div style={{ fontWeight: lead.unread ? 700 : 600, fontSize: 13, color: COLORS.textPrimary }}>{lead.customerName}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{lead.timestamp}</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, borderRadius: 4, padding: "1px 6px" }}>{sc.label}</span>
            <span style={{ fontSize: 10, color: ch.color, background: ch.bg, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{ch.label}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
            {lead.message}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: stage.color }}>
            {stage.label}{lead.conversionStage === "converted" && lead.roNumber ? ` · ${lead.roNumber}` : ` · ${lead.intent}`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Conversation Panel ───────────────────────────────────────
function ConversationPanel({ lead, onCreateRO }) {
  const [draft, setDraft] = useState(lead.aiDraft || "");
  const [sent, setSent] = useState(false);
  const ch = CHANNEL_CONFIG[lead.channel] || CHANNEL_CONFIG.sms;

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#fff", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: lead.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>{lead.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{lead.customerName}</div>
          <div style={{ fontSize: 12, color: ch.color, fontWeight: 600 }}>{lead.customerHandle} via {ch.label}</div>
        </div>
        {lead.conversionStage === "booked" || lead.conversionStage === "converted" ? (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} />
            {lead.conversionStage === "converted" ? `RO Created · ${lead.roNumber}` : lead.appointmentDate}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Phone size={13} /> Call
            </button>
            <button style={{ background: COLORS.primary, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={13} /> Book Appointment
            </button>
          </div>
        )}
      </div>

      {/* Platform source context */}
      <div style={{ paddingTop: 14 }}>
        <InstagramStoryHeader lead={lead} />
        <TikTokVideoHeader lead={lead} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12, background: "#FAFAF8" }}>
        {lead.thread.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "advisor" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "72%",
              background: msg.role === "advisor" ? COLORS.primary : "#fff",
              color: msg.role === "advisor" ? "#fff" : COLORS.textPrimary,
              borderRadius: msg.role === "advisor" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px",
              fontSize: 14,
              lineHeight: 1.5,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              border: msg.role === "advisor" ? "none" : "1px solid #E5E7EB",
            }}>
              {msg.text}
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>{msg.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insight Bar */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Zap size={14} color="#FF6B35" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 2 }}>AI INSIGHT</div>
          <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.4 }}>{lead.aiInsight}</div>
        </div>
        {lead.conversionStage !== "booked" && lead.conversionStage !== "converted" && (
          <button
            onClick={onCreateRO}
            style={{ flexShrink: 0, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            <FileText size={13} />
            Create RO Draft
          </button>
        )}
      </div>

      {/* Reply Composer */}
      {lead.conversionStage !== "booked" && lead.conversionStage !== "converted" && (
        <div style={{ background: "#fff", borderTop: "1px solid #E5E7EB", padding: "12px 16px" }}>
          {lead.aiDraft && !sent && (
            <div style={{ background: "#FFF7F0", border: "1px solid #FFD4BC", borderRadius: 8, padding: "8px 10px", marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Zap size={12} color={COLORS.accent} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent, marginBottom: 3 }}>AI DRAFT — Review before sending</div>
                <div style={{ fontSize: 12, color: COLORS.textPrimary, lineHeight: 1.4 }}>{lead.aiDraft}</div>
              </div>
              <button
                onClick={() => setDraft(lead.aiDraft)}
                style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
              >
                Use
              </button>
            </div>
          )}
          {sent && (
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "10px 14px", marginBottom: 10, display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600, color: "#059669" }}>
              <CheckCircle size={16} />
              Sent via {CHANNEL_CONFIG[lead.channel]?.label}! Customer will be notified.
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={`Reply via ${ch.label}…`}
              rows={3}
              style={{ flex: 1, resize: "none", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", lineHeight: 1.5 }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              style={{ background: draft.trim() ? COLORS.accent : "#E5E7EB", color: draft.trim() ? "#fff" : COLORS.textMuted, border: "none", borderRadius: 10, padding: "12px 16px", cursor: draft.trim() ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, flexShrink: 0 }}
            >
              <Send size={15} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Convert to RO Modal ──────────────────────────────────────
function ConvertToROModal({ lead, onClose, onConverted }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: lead.customerName.split(" ")[0] || "",
    lastName: lead.customerName.split(" ").slice(1).join(" ") || "",
    phone: "",
    email: "",
    year: "",
    make: "",
    model: "",
    mileage: "",
    vin: "",
    complaint: lead.intent || "",
    serviceType: "standard",
    priority: lead.score === "urgent" ? "urgent" : lead.score === "hot" ? "high" : "normal",
  });

  const ch = CHANNEL_CONFIG[lead.channel] || CHANNEL_CONFIG.sms;

  const roNumber = `RO-${Math.floor(2240 + Math.random() * 100)}`;

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const labelStyle = { fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 };
  const inputStyle = { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const rowStyle = { display: "flex", gap: 12 };
  const colStyle = { flex: 1 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: 560, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Modal Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: COLORS.textPrimary }}>Create RO Draft</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
              Converting {lead.channel === "instagram" ? "Instagram" : lead.channel === "tiktok" ? "TikTok" : ch.label} lead — {lead.customerName}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: COLORS.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {/* Step Indicators */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 0 }}>
          {[
            { n: 1, label: lead.channel === "instagram" ? "Instagram Context" : lead.channel === "tiktok" ? "TikTok Context" : "Lead Context" },
            { n: 2, label: "Customer & Vehicle" },
            { n: 3, label: "RO Draft" },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                  background: step >= s.n ? (step === s.n ? COLORS.accent : COLORS.primary) : "#E5E7EB",
                  color: step >= s.n ? "#fff" : COLORS.textMuted,
                }}>
                  {step > s.n ? <CheckCircle size={13} /> : s.n}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 500, color: step === s.n ? COLORS.textPrimary : COLORS.textMuted }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n + 0 ? COLORS.primary : "#E5E7EB", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Step 1: Platform context */}
          {step === 1 && (
            <div>
              {/* Platform-specific header */}
              {lead.channel === "instagram" && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <Instagram size={22} color="#fff" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Instagram DM</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{lead.channelHandle}</div>
                    </div>
                  </div>
                  {lead.storyThumbnail && (
                    <div style={{ background: "#FFF0F5", border: "1px solid #E1306C30", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#833AB4", marginBottom: 6 }}>STORY REPLY CONTEXT</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #833AB4, #E1306C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Image size={16} color="#fff" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{lead.storyThumbnail.label}</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{lead.storyThumbnail.caption}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lead.channel === "tiktok" && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ background: "#010101", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <div style={{ position: "relative" }}>
                      <Video size={22} color="#fff" />
                      <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#FE2C55" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>TikTok DM</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{lead.channelHandle}</div>
                    </div>
                  </div>
                  {lead.sourceVideo && (
                    <div style={{ background: "#F8F8F8", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#010101", marginBottom: 6 }}>SOURCE VIDEO</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#010101", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
                          <Play size={16} color="#fff" />
                          <div style={{ position: "absolute", bottom: 2, right: 2, background: "#FE2C55", borderRadius: 2, width: 5, height: 5 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{lead.sourceVideo.title}</div>
                          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{lead.sourceVideo.views} views</span>
                            <span style={{ fontSize: 11, color: "#FE2C55", fontWeight: 600 }}>{lead.sourceVideo.likes} likes</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2, fontStyle: "italic" }}>{lead.sourceVideo.caption}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lead.channel !== "instagram" && lead.channel !== "tiktok" && (
                <div style={{ background: ch.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
                  <ch.icon size={22} color={ch.color} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ch.color }}>{ch.label} Message</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{lead.channelHandle}</div>
                  </div>
                </div>
              )}

              {/* Customer message */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Customer Message</div>
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.5, fontStyle: "italic" }}>
                  "{lead.message}"
                </div>
              </div>

              {/* AI Insight */}
              <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: 4 }}>AI ASSESSMENT</div>
                <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.5 }}>{lead.aiInsight}</div>
              </div>
            </div>
          )}

          {/* Step 2: Customer & Vehicle */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <User size={15} color={COLORS.accent} /> Customer Information
                </div>
                <div style={rowStyle}>
                  <div style={colStyle}>
                    <div style={labelStyle}>First Name</div>
                    <input value={formData.firstName} onChange={e => set("firstName", e.target.value)} style={inputStyle} placeholder="First name" />
                  </div>
                  <div style={colStyle}>
                    <div style={labelStyle}>Last Name</div>
                    <input value={formData.lastName} onChange={e => set("lastName", e.target.value)} style={inputStyle} placeholder="Last name" />
                  </div>
                </div>
              </div>
              <div style={rowStyle}>
                <div style={colStyle}>
                  <div style={labelStyle}>Phone</div>
                  <input value={formData.phone} onChange={e => set("phone", e.target.value)} style={inputStyle} placeholder="(650) 555-0000" />
                </div>
                <div style={colStyle}>
                  <div style={labelStyle}>Email</div>
                  <input value={formData.email} onChange={e => set("email", e.target.value)} style={inputStyle} placeholder="customer@email.com" />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Car size={15} color={COLORS.accent} /> Vehicle Information
                </div>
                <div style={rowStyle}>
                  <div style={colStyle}>
                    <div style={labelStyle}>Year</div>
                    <input value={formData.year} onChange={e => set("year", e.target.value)} style={inputStyle} placeholder="2020" />
                  </div>
                  <div style={colStyle}>
                    <div style={labelStyle}>Make</div>
                    <input value={formData.make} onChange={e => set("make", e.target.value)} style={inputStyle} placeholder="Toyota" />
                  </div>
                  <div style={colStyle}>
                    <div style={labelStyle}>Model</div>
                    <input value={formData.model} onChange={e => set("model", e.target.value)} style={inputStyle} placeholder="Camry" />
                  </div>
                </div>
                <div style={{ ...rowStyle, marginTop: 12 }}>
                  <div style={colStyle}>
                    <div style={labelStyle}>Mileage</div>
                    <input value={formData.mileage} onChange={e => set("mileage", e.target.value)} style={inputStyle} placeholder="52,000" />
                  </div>
                  <div style={{ flex: 2 }}>
                    <div style={labelStyle}>VIN (optional)</div>
                    <input value={formData.vin} onChange={e => set("vin", e.target.value)} style={inputStyle} placeholder="1HGBH41JXMN109186" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: RO Draft */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* RO Preview Card */}
              <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 12, padding: "16px 18px", color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>REPAIR ORDER DRAFT</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{roNumber}</div>
                  </div>
                  <div style={{ background: COLORS.accent, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
                    DRAFT
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{formData.firstName} {formData.lastName}</div>
                {(formData.year || formData.make || formData.model) && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                    {[formData.year, formData.make, formData.model].filter(Boolean).join(" ")}
                    {formData.mileage && ` · ${formData.mileage} mi`}
                  </div>
                )}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", gap: 8 }}>
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                    Source: {ch.label}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
                    Priority: {formData.priority}
                  </div>
                </div>
              </div>

              {/* Complaint */}
              <div>
                <div style={labelStyle}>Customer Complaint</div>
                <textarea
                  value={formData.complaint}
                  onChange={e => set("complaint", e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Describe the customer's concern…"
                />
              </div>

              {/* Service Type + Priority */}
              <div style={rowStyle}>
                <div style={colStyle}>
                  <div style={labelStyle}>Service Type</div>
                  <select value={formData.serviceType} onChange={e => set("serviceType", e.target.value)} style={inputStyle}>
                    <option value="standard">Standard</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inspection">Inspection</option>
                    <option value="warranty">Warranty</option>
                  </select>
                </div>
                <div style={colStyle}>
                  <div style={labelStyle}>Priority</div>
                  <select value={formData.priority} onChange={e => set("priority", e.target.value)} style={inputStyle}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Social source note */}
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <CheckCircle size={14} color="#059669" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: "#047857", lineHeight: 1.4 }}>
                  This RO will be tagged as <strong>{ch.label} social lead</strong> for conversion tracking. The original conversation will be linked in the RO notes.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAF8" }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, cursor: "pointer" }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: step === n ? COLORS.accent : "#D1D5DB" }} />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{ background: COLORS.accent, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => onConverted(roNumber)}
              style={{ background: COLORS.primary, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <FileText size={14} />
              Create RO {roNumber}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function SocialInboxScreen() {
  const [selectedId, setSelectedId] = useState("lead-001");
  const [filter, setFilter] = useState("all");
  const [convertModal, setConvertModal] = useState(null);
  const [leads, setLeads] = useState(LEADS);

  const selectedLead = leads.find(l => l.id === selectedId);
  const filteredLeads = filter === "all" ? leads : leads.filter(l => l.score === filter || l.channel === filter);

  const unreadCount = leads.filter(l => l.unread).length;

  const FILTERS = [
    { key: "all", label: `All (${leads.length})` },
    { key: "hot", label: "Hot" },
    { key: "urgent", label: "Urgent" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
    { key: "booked", label: "Booked" },
  ];

  function handleConverted(roNumber) {
    setLeads(prev => prev.map(l =>
      l.id === convertModal.id
        ? { ...l, conversionStage: "converted", score: "booked", roNumber, unread: false }
        : l
    ));
    setConvertModal(null);
  }

  return (
    <div style={{ padding: "24px 28px 0", display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: COLORS.textPrimary }}>Social Inbox</h1>
            {unreadCount > 0 && (
              <div style={{ background: COLORS.accent, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{unreadCount} new</div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>All your social channels, Google Messages, and texts — one place to book every customer.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["instagram", "tiktok", "facebook", "google"].map(ch => {
              const c = CHANNEL_CONFIG[ch];
              const count = leads.filter(l => l.channel === ch).length;
              return (
                <div key={ch} style={{ background: c.bg, borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                  <c.icon size={12} color={c.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", gap: 0, background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", minHeight: 0 }}>

        {/* Lead List */}
        <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #E5E7EB" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 8, padding: "7px 10px", border: "1px solid #E5E7EB", marginBottom: 8 }}>
              <Search size={13} color={COLORS.textMuted} />
              <input placeholder="Search conversations…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, border: "1px solid",
                    borderColor: filter === f.key ? COLORS.accent : "#E5E7EB",
                    background: filter === f.key ? COLORS.accent + "15" : "transparent",
                    color: filter === f.key ? COLORS.accent : COLORS.textSecondary,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                selected={selectedId === lead.id}
                onClick={() => setSelectedId(lead.id)}
              />
            ))}
          </div>
        </div>

        {/* Conversation View */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {selectedLead && (
            <ConversationPanel
              lead={selectedLead}
              onCreateRO={() => setConvertModal(selectedLead)}
            />
          )}
        </div>

        {/* Right Panel: Customer Profile */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: "1px solid #E5E7EB", padding: "16px", overflowY: "auto", background: "#FAFAF8" }}>
          {selectedLead && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.textPrimary }}>Lead Profile</div>

              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: selectedLead.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 auto 8px" }}>{selectedLead.avatar}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedLead.customerName}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{selectedLead.customerHandle}</div>
              </div>

              <div style={{ background: SCORE_CONFIG[selectedLead.score]?.bg, border: `1px solid ${SCORE_CONFIG[selectedLead.score]?.color}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Lead Score</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: SCORE_CONFIG[selectedLead.score]?.color }}>{SCORE_CONFIG[selectedLead.score]?.label}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Intent", value: selectedLead.intent },
                  { label: "Channel", value: CHANNEL_CONFIG[selectedLead.channel]?.label },
                  { label: "Stage", value: STAGE_CONFIG[selectedLead.conversionStage]?.label },
                  { label: "First Contact", value: selectedLead.timestamp },
                  ...(selectedLead.dmSource === "story_reply" ? [{ label: "Source", value: "Story Reply" }] : []),
                  ...(selectedLead.dmSource === "video_comment" ? [{ label: "Source", value: "Video Comment" }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: COLORS.textMuted }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {selectedLead.conversionStage !== "booked" && selectedLead.conversionStage !== "converted" && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Calendar size={13} /> Book Appointment
                  </button>
                  <button style={{ background: "#F3F4F6", color: COLORS.textSecondary, border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Phone size={13} /> Call Customer
                  </button>
                  <button
                    onClick={() => setConvertModal(selectedLead)}
                    style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <FileText size={13} /> Create RO Draft
                  </button>
                </div>
              )}

              {(selectedLead.conversionStage === "booked" || selectedLead.conversionStage === "converted") && (
                <div style={{ marginTop: 16, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                  <CheckCircle size={22} color="#059669" style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>
                    {selectedLead.conversionStage === "converted" ? "RO Created" : "Appointment Booked"}
                  </div>
                  <div style={{ fontSize: 12, color: "#047857", marginTop: 4 }}>
                    {selectedLead.roNumber || selectedLead.appointmentDate}
                  </div>
                  <button style={{ marginTop: 10, background: "#fff", border: "1px solid #A7F3D0", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#059669", cursor: "pointer", width: "100%" }}>
                    {selectedLead.conversionStage === "converted" ? "View RO" : "View in Schedule"}
                  </button>
                </div>
              )}

              {/* Social Metrics */}
              <div style={{ marginTop: 16, padding: "12px", background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Social Signal</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <Heart size={14} color="#E1306C" />
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{selectedLead.sourceVideo?.likes || "—"}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>Likes</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Play size={14} color="#010101" />
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{selectedLead.sourceVideo?.views || "—"}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>Views</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Star size={14} color="#F59E0B" />
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>New</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>Customer</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Convert to RO Modal */}
      {convertModal && (
        <ConvertToROModal
          lead={convertModal}
          onClose={() => setConvertModal(null)}
          onConverted={handleConverted}
        />
      )}
    </div>
  );
}
