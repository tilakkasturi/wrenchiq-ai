import { useState } from "react";
import {
  Camera, Mic, CheckCircle, AlertTriangle, Clock, Package,
  ChevronRight, Zap, User, Car, Wrench, Play, Send,
  MessageSquare, Star, Shield, FileText, Plus, Flag,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ─── Tech's day assignment ────────────────────────────────────
const TECH = {
  name: "DeShawn Williams",
  initials: "DW",
  title: "ASE Master Technician",
  certifications: ["Engine", "Brakes", "Electrical", "HVAC", "Transmission"],
};

const JOBS = [
  {
    id: "j1",
    roId: "RO-2024-1192",
    customer: "Sarah Chen",
    vehicle: "2022 Tesla Model 3",
    vin: "5YJ3E1EA8NF001234",
    mileage: "34,200",
    bay: "1",
    service: "Annual Service",
    status: "in-progress",
    priority: "normal",
    timeEstimate: "1.5 hrs",
    timeStarted: "9:15 AM",
    tsbs: [
      { id: "tsb-2024-22", title: "Phantom Braking / ADAS Camera Calibration", severity: "medium" },
    ],
    notes: "Customer prefers text. Check ADAS cameras per TSB.",
    checklist: [
      { id: "c1", label: "Tire pressure check + rotation", done: true },
      { id: "c2", label: "Brake inspection (all 4 corners)", done: true },
      { id: "c3", label: "ADAS camera visual check", done: false },
      { id: "c4", label: "Wiper blade condition", done: false },
      { id: "c5", label: "Cabin air filter", done: false },
      { id: "c6", label: "Charging port + 12V battery test", done: false },
    ],
    photos: 4,
    findings: [
      { severity: "yellow", note: "Left rear tire: 4/32\", others 7/32\" — monitor" },
      { severity: "green", note: "Brakes all good, 8mm+ remaining" },
    ],
  },
  {
    id: "j2",
    roId: "RO-2024-1188",
    customer: "David Kim",
    vehicle: "2019 Honda CR-V",
    vin: "5J6RW2H85KA014928",
    mileage: "87,400",
    bay: "2",
    service: "90K Service + P0420 Diagnostic",
    status: "waiting-parts",
    priority: "high",
    timeEstimate: "3 hrs",
    timeStarted: null,
    tsbs: [
      { id: "tsb-19-052", title: "1.5T Oil Dilution — Honda Extended Warranty Review", severity: "high" },
    ],
    notes: "Walker catalytic converter on order — ETA 4 PM. P0420 code. Check TSB re: Honda goodwill.",
    checklist: [],
    photos: 0,
    findings: [],
  },
  {
    id: "j3",
    roId: "RO-2024-1193",
    customer: "Kevin Liu",
    vehicle: "2019 Toyota Camry",
    vin: "4T1B11HK1KU221456",
    mileage: "51,200",
    bay: "1",
    service: "Pre-Purchase Inspection",
    status: "upcoming",
    priority: "normal",
    timeEstimate: "1.5 hrs",
    timeStarted: null,
    tsbs: [],
    notes: "Customer buying this vehicle from private seller. 150-point inspection.",
    checklist: [],
    photos: 0,
    findings: [],
  },
];

const STATUS_CONFIG = {
  "in-progress": { label: "In Progress", color: "#3B82F6", bg: "#EFF6FF" },
  "waiting-parts": { label: "Waiting Parts", color: "#F59E0B", bg: "#FFFBEB" },
  "upcoming": { label: "Upcoming", color: "#6B7280", bg: "#F9FAFB" },
  "completed": { label: "Completed", color: "#059669", bg: "#ECFDF5" },
};

// ─── Phone Shell Component ────────────────────────────────────
function PhoneShell({ children, title }) {
  return (
    <div style={{
      width: 340,
      background: "#fff",
      borderRadius: 40,
      boxShadow: "0 32px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.12), inset 0 0 0 2px rgba(0,0,0,0.06)",
      border: "8px solid #1A1A1A",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Notch */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 100, height: 24, background: "#1A1A1A", borderRadius: "0 0 16px 16px", zIndex: 10 }} />

      {/* Status Bar */}
      <div style={{ background: COLORS.bgDark, padding: "28px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>9:41</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[3,2,2,1].map((w, i) => <div key={i} style={{ width: 3, height: 6 + i * 2, background: "#fff", borderRadius: 1, opacity: 0.7 + i * 0.1 }} />)}
          <div style={{ width: 16, height: 8, borderRadius: 2, border: "1.5px solid rgba(255,255,255,0.7)", marginLeft: 4, position: "relative" }}>
            <div style={{ position: "absolute", left: 1, top: 1, right: 4, bottom: 1, background: "#4ADE80", borderRadius: 1 }} />
            <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 2, height: 4, background: "rgba(255,255,255,0.5)", borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* App Header */}
      <div style={{ background: COLORS.bgDark, padding: "8px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={14} color="#fff" style={{ transform: "rotate(-45deg)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span></div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>Tech View</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
            {TECH.initials}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ height: 580, overflowY: "auto", background: "#F8FAFC" }}>
        {children}
      </div>

      {/* Home Indicator */}
      <div style={{ background: "#fff", padding: "8px 0 12px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 100, height: 4, borderRadius: 2, background: "#1A1A1A" }} />
      </div>
    </div>
  );
}

// ─── Job Card (in phone) ──────────────────────────────────────
function JobCard({ job, onSelect, selected }) {
  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.upcoming;
  const done = job.checklist.filter(c => c.done).length;
  const total = job.checklist.length;

  return (
    <div
      onClick={() => onSelect(job)}
      style={{
        margin: "0 12px 8px",
        background: "#fff",
        borderRadius: 14,
        border: `1.5px solid ${selected ? COLORS.accent : "#E5E7EB"}`,
        padding: "12px",
        cursor: "pointer",
        boxShadow: selected ? `0 0 0 2px ${COLORS.accent}30` : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {job.bay}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{job.customer.split(" ")[0]}'s {job.vehicle.split(" ").slice(1).join(" ")}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{job.service}</div>
        </div>
        <div style={{ background: sc.bg, borderRadius: 5, padding: "2px 6px" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: sc.color }}>{sc.label}</span>
        </div>
      </div>

      {job.tsbs.length > 0 && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", background: "#FFFBEB", borderRadius: 6, padding: "4px 6px", marginBottom: 6 }}>
          <Zap size={10} color="#D97706" />
          <span style={{ fontSize: 10, color: "#92400E", fontWeight: 600 }}>TSB: {job.tsbs[0].title.slice(0, 40)}…</span>
        </div>
      )}

      {total > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: "#F3F4F6", borderRadius: 2 }}>
            <div style={{ height: 4, background: done === total ? "#059669" : COLORS.accent, borderRadius: 2, width: `${(done / total) * 100}%`, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted }}>{done}/{total}</span>
        </div>
      )}
    </div>
  );
}

// ─── Job Detail (in phone) ────────────────────────────────────
function JobDetail({ job, onBack }) {
  const [checklist, setChecklist] = useState(job.checklist);
  const [note, setNote] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [photosAdded, setPhotosAdded] = useState(0);
  const [recording, setRecording] = useState(false);
  const [partRequested, setPartRequested] = useState(false);
  const [completed, setCompleted] = useState(false);
  const done = checklist.filter(c => c.done).length;

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  return (
    <div>
      {/* Back + header */}
      <div style={{ padding: "12px 12px 0", display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: COLORS.textSecondary }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{job.vehicle}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>{job.roId} · {job.mileage} mi</div>
        </div>
      </div>

      {/* TSB Alert */}
      {job.tsbs.map(tsb => (
        <div key={tsb.id} style={{ margin: "0 12px 10px", background: "linear-gradient(135deg, #FFFBEB, #FFF7ED)", border: "1px solid #FDE68A", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Zap size={12} color="#D97706" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>TSB Alert</div>
              <div style={{ fontSize: 10, color: "#78350F", lineHeight: 1.4 }}>{tsb.title}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Checklist */}
      {checklist.length > 0 && (
        <div style={{ margin: "0 12px 10px", background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary }}>Inspection Checklist</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: done === checklist.length ? "#059669" : COLORS.accent }}>{done}/{checklist.length}</span>
          </div>
          {checklist.map(item => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 12px", borderBottom: "1px solid #F9FAFB", cursor: "pointer" }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${item.done ? "#059669" : "#D1D5DB"}`, background: item.done ? "#059669" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.done && <CheckCircle size={11} color="#fff" />}
              </div>
              <span style={{ fontSize: 12, color: item.done ? COLORS.textMuted : COLORS.textPrimary, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ margin: "0 12px 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { icon: Camera, label: photosAdded > 0 ? `${photosAdded} Photo${photosAdded > 1 ? "s" : ""} Added ✓` : "Add Photo", color: "#3B82F6", bg: photosAdded > 0 ? "#DBEAFE" : "#EFF6FF", onClick: () => setPhotosAdded(n => n + 1) },
          { icon: Mic, label: recording ? "Recording… tap to stop" : "Voice Note", color: "#8B5CF6", bg: recording ? "#EDE9FE" : "#F5F3FF", onClick: () => setRecording(r => !r) },
          { icon: Package, label: partRequested ? "Part Requested ✓" : "Request Part", color: COLORS.accent, bg: partRequested ? "#FFF7ED" : "#FFF7ED", onClick: () => setPartRequested(true) },
          { icon: Flag, label: flagged ? "Flagged ✓" : "Flag Issue", color: "#EF4444", bg: "#FEF2F2", onClick: () => setFlagged(f => !f) },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            style={{ display: "flex", alignItems: "center", gap: 7, background: action.bg, border: `1px solid ${action.color}20`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: action.color }}
          >
            <action.icon size={14} />
            {action.label}
          </button>
        ))}
      </div>

      {/* Note input */}
      <div style={{ margin: "0 12px 10px" }}>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add inspection note… (voice or type)"
          rows={2}
          style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Findings */}
      {job.findings.length > 0 && (
        <div style={{ margin: "0 12px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6 }}>FINDINGS</div>
          {job.findings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6, background: f.severity === "yellow" ? "#FFFBEB" : "#F0FDF4", borderRadius: 8, padding: "6px 8px" }}>
              {f.severity === "yellow" ? <AlertTriangle size={11} color="#D97706" style={{ marginTop: 1, flexShrink: 0 }} /> : <CheckCircle size={11} color="#059669" style={{ marginTop: 1, flexShrink: 0 }} />}
              <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{f.note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Complete Button */}
      <div style={{ margin: "0 12px 12px" }}>
        {completed ? (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>Report Generated ✓</div>
            <div style={{ fontSize: 11, color: "#047857", marginTop: 3 }}>Advisor notified · Customer report sent</div>
          </div>
        ) : (
          <button
            onClick={() => (done === checklist.length && checklist.length > 0) && setCompleted(true)}
            style={{ width: "100%", background: done === checklist.length && checklist.length > 0 ? "#059669" : COLORS.accent, color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
          >
            {done === checklist.length && checklist.length > 0 ? "✓ Mark Complete & Generate Report" : `Complete Inspection (${done}/${checklist.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Phone Home Screen ────────────────────────────────────────
function PhoneHomeScreen({ jobs, onSelectJob }) {
  const inProgress = jobs.filter(j => j.status === "in-progress").length;
  const waiting = jobs.filter(j => j.status === "waiting-parts").length;

  return (
    <div>
      {/* Tech greeting */}
      <div style={{ margin: "12px 12px 10px", background: "linear-gradient(135deg, #0D3B45, #1A5C6B)", borderRadius: 14, padding: "12px 14px", color: "#fff" }}>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Thursday, March 5 · 9:41 AM</div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Good morning, {TECH.name.split(" ")[0]}!</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{jobs.length} jobs today · {inProgress} active · {waiting} waiting parts</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {TECH.certifications.map(cert => (
            <span key={cert} style={{ fontSize: 9, background: "rgba(255,107,53,0.2)", color: COLORS.accent, borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>{cert}</span>
          ))}
        </div>
      </div>

      {/* Today's Jobs */}
      <div style={{ padding: "0 12px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Today's Jobs</span>
        <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>3 assigned</span>
      </div>

      {jobs.map(job => (
        <JobCard key={job.id} job={job} onSelect={onSelectJob} selected={false} />
      ))}

      {/* Quick Stats */}
      <div style={{ margin: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "Billed Today", value: "3.5 hrs", color: "#059669" },
          { label: "Efficiency", value: "91%", color: "#3B82F6" },
          { label: "Avg Rating", value: "4.97★", color: "#F59E0B" },
          { label: "Parts Waiting", value: "1", color: COLORS.accent },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function TechMobileScreen() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [phoneView, setPhoneView] = useState("home"); // "home" | "jobs" | "detail"

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setPhoneView("detail");
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>Technician Mobile</h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            What {TECH.name} sees on their phone in the bay — voice notes, photos, real-time TSBs.
          </p>
        </div>
        <div style={{ background: "linear-gradient(135deg, #0D3B45, #1A5C6B)", borderRadius: 10, padding: "10px 16px", color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>iOS + Android</div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>React Native · Offline capable</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 40, alignItems: "start" }}>

        {/* Phone */}
        <div style={{ position: "sticky", top: 24 }}>
          <PhoneShell title="Tech Mobile">
            {phoneView === "home" && (
              <PhoneHomeScreen jobs={JOBS} onSelectJob={handleSelectJob} />
            )}
            {phoneView === "detail" && selectedJob && (
              <JobDetail job={selectedJob} onBack={() => setPhoneView("home")} />
            )}
          </PhoneShell>
        </div>

        {/* Feature Explainer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "20px 24px", color: "#fff" }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Built for the Bay. Not the Boardroom.</div>
            <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>
              Most shop software is built for service advisors sitting at a desk. WrenchIQ Tech Mobile is built for someone with grease on their hands — voice-first, photo-first, one tap.
            </div>
          </div>

          {[
            {
              icon: Mic,
              color: "#8B5CF6",
              title: "Voice-to-Text Notes",
              desc: "Say \"front rotor worn past service limit, checking other side\" — it's transcribed and attached to the RO automatically. No typing with dirty gloves.",
              stat: "3× faster than typing",
            },
            {
              icon: Camera,
              color: "#3B82F6",
              title: "One-Tap Photo Capture",
              desc: "Point, tap, done. Photos automatically attach to the right RO inspection item. No apps to switch, no manual filing. Videos too — 60 second limit, perfect for customer evidence.",
              stat: "Avg 8 photos/inspection",
            },
            {
              icon: Zap,
              color: "#F59E0B",
              title: "TSBs Before You Ask",
              desc: "As soon as a vehicle is assigned, WrenchIQ surfaces every relevant TSB. DeShawn doesn't have to remember — the system remembers for him.",
              stat: "2,100+ TSBs in DB",
            },
            {
              icon: Package,
              color: COLORS.accent,
              title: "Request Parts Without Leaving the Bay",
              desc: "Tap 'Request Part' → advisor gets it immediately on their desktop. WrenchIQ finds the best price and availability while the tech keeps working.",
              stat: "Avg 4 min to order",
            },
            {
              icon: Flag,
              color: "#EF4444",
              title: "Flag Safety Concerns Instantly",
              desc: "Finds something dangerous not on the original RO? One tap creates an urgent notification to the advisor. Customer sees it in their health report within minutes.",
              stat: "0 missed safety items",
            },
            {
              icon: CheckCircle,
              color: "#059669",
              title: "Clock In/Out per Job",
              desc: "Tech taps to start and stop each job. Hours flow automatically to Gusto payroll. Efficiency score calculated in real-time. No paper time cards.",
              stat: "Gusto payroll sync",
            },
          ].map((feature, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: feature.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <feature.icon size={20} color={feature.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{feature.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>{feature.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: feature.color, background: feature.color + "10", borderRadius: 5, padding: "2px 8px", display: "inline-block" }}>{feature.stat}</div>
              </div>
            </div>
          ))}

          {/* Tech Performance */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Tech Performance Dashboard</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Avg Efficiency", value: "91%", trend: "+3%", color: "#059669" },
                { label: "Avg Rating", value: "4.97★", trend: "Top 5%", color: "#F59E0B" },
                { label: "Inspections", value: "2,847", trend: "lifetime", color: "#3B82F6" },
                { label: "Accuracy Rate", value: "99.1%", trend: "No-comeback", color: "#8B5CF6" },
                { label: "Photos/Job", value: "8.2", trend: "avg", color: COLORS.accent },
                { label: "TSBs Applied", value: "142", trend: "this year", color: COLORS.primary },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: "center", background: "#F9FAFB", borderRadius: 10, padding: "12px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 600, marginTop: 2 }}>{m.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
