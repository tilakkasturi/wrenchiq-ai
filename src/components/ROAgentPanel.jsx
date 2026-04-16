/**
 * ROAgentPanel — Inbound Leads Queue
 *
 * Shows social/SMS inbound signals. Advisor clicks "Draft RO" and the agent
 * calls Claude to extract repair intent, then pre-populates NewROWizard.
 */

import { useState, useEffect } from "react";
import { MessageCircle, Phone, Instagram, Facebook, Zap, ChevronDown, ChevronUp, Loader } from "lucide-react";
import { COLORS } from "../theme/colors";

// Demo inbound leads — in production these come from webhook ingestion
const DEMO_LEADS = [
  {
    id: "lead-001",
    channel: "Instagram",
    customerName: "Jasmine Torres",
    phone: "(650) 555-0241",
    time: "12 min ago",
    urgency: "high",
    message: "Hey! My brakes are making this horrible grinding noise every time I stop. It started yesterday. Is there any way you can fit me in today? I'm scared to drive it on the highway.",
    avatar: "JT",
  },
  {
    id: "lead-002",
    channel: "SMS",
    customerName: "Marcus Webb",
    phone: "(415) 555-0183",
    time: "34 min ago",
    urgency: "medium",
    message: "Hi this is Marcus, I drove by your shop. My check engine light has been on for about a week and my car is idling rough sometimes. Can I schedule a diagnostic?",
    avatar: "MW",
  },
  {
    id: "lead-003",
    channel: "Google",
    customerName: "Diana Moss",
    phone: "(408) 555-0197",
    time: "1 hr ago",
    urgency: "low",
    message: "Hi I need my 60k service done. My dealer quoted me $950 but that seems high. Do you do Honda services? My car is a 2021 HR-V.",
    avatar: "DM",
  },
  {
    id: "lead-004",
    channel: "Facebook",
    customerName: "Carlos Reyes",
    phone: "(650) 555-0312",
    time: "2 hr ago",
    urgency: "medium",
    message: "My car has been overheating on my commute, temp gauge goes into the red. I let it cool down and it's fine again. Should I be worried? Can you take a look?",
    avatar: "CR",
  },
];

const CHANNEL_ICONS = {
  Instagram: <Instagram size={12} />,
  Facebook:  <Facebook size={12} />,
  SMS:       <Phone size={12} />,
  Google:    <span style={{ fontSize: 11, fontWeight: 800 }}>G</span>,
};

const URGENCY_STYLE = {
  high:   { bg: "#FEF2F2", color: "#DC2626", label: "Urgent" },
  medium: { bg: "#FFF7ED", color: "#EA580C", label: "Today" },
  low:    { bg: "#F0FDF4", color: "#16A34A", label: "Schedule" },
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function ROAgentPanel({ onDraftRO, ro }) {
  const [expanded, setExpanded]   = useState(true);
  const [drafting, setDrafting]   = useState(null);   // lead id being drafted
  const [dismissed, setDismissed] = useState(new Set());
  const [error, setError]         = useState(null);
  const [tribalNudges, setTribalNudges] = useState([]);
  const [dismissedNudges, setDismissedNudges] = useState(new Set());

  useEffect(() => {
    fetch(`${API_BASE}/api/tribal-notes/shop-001`)
      .then(r => r.ok ? r.json() : [])
      .then(notes => {
        if (!Array.isArray(notes)) return;
        const matched = notes.filter(note => matchesRO(note, ro));
        setTribalNudges(matched);
      })
      .catch(() => {});
  }, [ro]);

  function matchesRO(note, ro) {
    if (!ro) return note.triggerType === 'any_ro' || !note.triggerType;
    const t = note.triggerType || 'any_ro';
    if (t === 'any_ro') return true;
    if (t === 'mpi_only') return ro.hasDVI === true || ro.dviCompleted === true;
    if (t.startsWith('vehicle_type:')) {
      const origin = (ro.vehicleOrigin || '').toLowerCase();
      const target = t.replace('vehicle_type:', '').toLowerCase();
      return origin.includes(target) || (target === 'japanese' && ['toyota','honda','nissan','mazda','subaru','lexus','acura','infiniti'].some(m => (ro.vehicle?.make||'').toLowerCase().includes(m)));
    }
    if (t.startsWith('mileage_range:')) {
      const [min, max] = t.replace('mileage_range:', '').split('-').map(Number);
      const miles = ro.mileage || ro.currentMileage || ro.vehicle?.mileage || 0;
      return miles >= min && miles <= max;
    }
    return false;
  }

  const visibleLeads = DEMO_LEADS.filter(l => !dismissed.has(l.id));

  async function handleDraft(lead) {
    setDrafting(lead.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ro-agent/draft`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: lead.customerName,
          phone:        lead.phone,
          channel:      lead.channel,
          message:      lead.message,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      onDraftRO({
        lead,
        draft: data.draft,
      });
      setDismissed(prev => new Set([...prev, lead.id]));
    } catch (err) {
      console.error("[ROAgentPanel] draft error:", err);
      setError(`Failed to draft RO: ${err.message}`);
    } finally {
      setDrafting(null);
    }
  }

  if (visibleLeads.length === 0) return null;

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 14,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderBottom: expanded ? `1px solid ${COLORS.border}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: `linear-gradient(135deg, ${COLORS.primary}, #0A5068)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageCircle size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
            ROAgent — Inbound Leads
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#fff",
            background: COLORS.accent,
            borderRadius: 10, padding: "1px 7px",
          }}>
            {visibleLeads.length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textMuted }}>
          <span style={{ fontSize: 11 }}>AI-triaged from social + SMS</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div>
          {error && (
            <div style={{ padding: "8px 16px", fontSize: 12, color: "#DC2626", background: "#FEF2F2" }}>
              {error}
            </div>
          )}
          {tribalNudges.filter(n => !dismissedNudges.has(n._id)).map(nudge => (
            <div key={nudge._id} style={{
              background: '#FFF7ED',
              borderLeft: '3px solid #FF6B35',
              borderRadius: 6,
              padding: '10px 12px',
              margin: '8px 16px 0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>&#x1F4CC;</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 3 }}>
                  Shop Rule
                </div>
                <div style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.4 }}>
                  {nudge.note}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onClick={() => console.log('Add tribal note to RO:', nudge)}
                    style={{ fontSize: 11, padding: '3px 8px', background: '#FF6B35', color: '#fff',
                      border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                    Add to RO
                  </button>
                  <button
                    onClick={() => setDismissedNudges(prev => new Set([...prev, nudge._id]))}
                    style={{ fontSize: 11, padding: '3px 8px', background: '#F3F4F6',
                      border: 'none', borderRadius: 4, cursor: 'pointer', color: '#6B7280' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
          {visibleLeads.map((lead, i) => {
            const urgency = URGENCY_STYLE[lead.urgency];
            const isDrafting = drafting === lead.id;
            return (
              <div
                key={lead.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: i < visibleLeads.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  opacity: isDrafting ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: COLORS.primary,
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {lead.avatar}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                      {lead.customerName}
                    </span>
                    <span style={{
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: 10, fontWeight: 600,
                      color: "#6B7280", background: "#F3F4F6",
                      borderRadius: 6, padding: "1px 6px",
                    }}>
                      {CHANNEL_ICONS[lead.channel]}
                      {lead.channel}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: urgency.color, background: urgency.bg,
                      borderRadius: 6, padding: "1px 6px",
                    }}>
                      {urgency.label}
                    </span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" }}>
                      {lead.time}
                    </span>
                  </div>
                  <p style={{
                    margin: "0 0 8px",
                    fontSize: 12, color: COLORS.textSecondary,
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {lead.message}
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleDraft(lead)}
                      disabled={isDrafting || !!drafting}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 12px",
                        background: isDrafting
                          ? "#F3F4F6"
                          : `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
                        color: isDrafting ? COLORS.textMuted : "#fff",
                        border: "none",
                        borderRadius: 7,
                        fontSize: 12, fontWeight: 700,
                        cursor: isDrafting ? "not-allowed" : "pointer",
                        transition: "opacity 0.2s",
                      }}
                    >
                      {isDrafting
                        ? <><Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> Drafting...</>
                        : <><Zap size={11} /> Draft RO</>
                      }
                    </button>
                    <button
                      onClick={() => setDismissed(prev => new Set([...prev, lead.id]))}
                      disabled={!!drafting}
                      style={{
                        padding: "5px 10px",
                        background: "transparent",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 7,
                        fontSize: 12, color: COLORS.textMuted,
                        cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
