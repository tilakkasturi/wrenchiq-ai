// TechHomeScreen.jsx — AE-779
// iPad-optimized technician home: assigned jobs as large touch-friendly cards

import { useState } from "react";
import { Clock, QrCode, ChevronDown, ChevronRight, CheckCircle, Wrench, Car } from "lucide-react";
import { COLORS } from "../theme/colors";

const TECH = {
  name: "Marcus",
  greeting: "Good morning",
  day: "Tuesday, March 21",
};

const DEMO_JOBS = [
  {
    id: "RO-2024-1189",
    status: "ACTIVE",
    vehicle: "2019 Honda CR-V",
    customer: "David Kim",
    job: "Catalytic Converter Replacement",
    note: "Diagnosed: P0420",
    estimate: "1.5 hrs",
    bay: "Bay 3",
    accentColor: COLORS.accent,
    statusColor: COLORS.success,
    statusLabel: "ACTIVE",
  },
  {
    id: "RO-2024-1192",
    status: "UP_NEXT",
    vehicle: "2022 Tesla Model 3",
    customer: "Sarah Chen",
    job: "Brake Inspection + Tire Rotation",
    note: "Annual service",
    estimate: "1.2 hrs",
    bay: "Bay 3",
    accentColor: "#3B82F6",
    statusColor: "#3B82F6",
    statusLabel: "UP NEXT",
  },
  {
    id: "RO-2024-1185",
    status: "QUEUED",
    vehicle: "2021 Ford F-150",
    customer: "Robert Taylor",
    job: "Oil Change + Full Service",
    note: "Synthetic 5W-30",
    estimate: "0.8 hrs",
    bay: "Unassigned",
    accentColor: COLORS.textMuted,
    statusColor: COLORS.textMuted,
    statusLabel: "QUEUED",
  },
];

const COMPLETED_JOBS = [
  {
    id: "RO-2024-1178",
    status: "DONE",
    vehicle: "2020 Toyota Camry",
    customer: "Monica Santos",
    job: "Timing Belt + Water Pump",
    note: "Completed at 9:42 AM",
    estimate: "3.0 hrs",
    bay: "Bay 2",
    accentColor: COLORS.success,
    statusColor: COLORS.success,
    statusLabel: "DONE",
  },
];

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        flex: 1,
        background: COLORS.bgCard,
        borderRadius: 12,
        padding: "16px 20px",
        border: `1px solid ${COLORS.border}`,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function JobCard({ job, onOpenDVI }) {
  const isActive = job.status === "ACTIVE";
  const isDone = job.status === "DONE";

  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
        minHeight: 140,
        display: "flex",
        opacity: isDone ? 0.75 : 1,
        boxShadow: isActive ? "0 4px 16px rgba(255,107,53,0.12)" : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 6, background: job.accentColor, flexShrink: 0 }} />

      {/* Card content */}
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Top row: RO number + status badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: COLORS.textMuted,
              letterSpacing: "0.05em",
            }}
          >
            {job.id}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: job.statusColor,
              background: `${job.statusColor}18`,
              border: `1px solid ${job.statusColor}40`,
              borderRadius: 6,
              padding: "3px 10px",
              letterSpacing: "0.06em",
            }}
          >
            {job.statusLabel}
          </span>
        </div>

        {/* Vehicle + customer */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Car size={16} color={COLORS.textSecondary} />
            <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>{job.vehicle}</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 2, paddingLeft: 24 }}>
            {job.customer} · {job.bay}
          </div>
        </div>

        {/* Job description */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Wrench size={15} color={COLORS.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{job.job}</span>
            {job.note && (
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}> · {job.note}</span>
            )}
          </div>
        </div>

        {/* Time estimate */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={14} color={COLORS.textMuted} />
          <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Est. {job.estimate}</span>
        </div>

        {/* Action buttons */}
        {!isDone && (
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {isActive ? (
              <button
                onClick={() => onOpenDVI && onOpenDVI(job)}
                style={{
                  flex: 1,
                  height: 48,
                  background: COLORS.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Open DVI
              </button>
            ) : (
              <button
                style={{
                  flex: 1,
                  height: 48,
                  background: "transparent",
                  color: COLORS.primary,
                  border: `2px solid ${COLORS.primary}`,
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Start Job
              </button>
            )}
          </div>
        )}

        {isDone && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={15} color={COLORS.success} />
            <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{job.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TechHomeScreen({ onOpenDVI }) {
  const [activeTab, setActiveTab] = useState("my-jobs");
  const [completedOpen, setCompletedOpen] = useState(false);

  const navTabs = [
    { id: "my-jobs", label: "My Jobs" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column" }}>
      {/* Sub-nav */}
      <div
        style={{
          height: 48,
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 4,
        }}
      >
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0 18px",
              height: 36,
              borderRadius: 8,
              border: "none",
              background: activeTab === tab.id ? COLORS.primary : "transparent",
              color: activeTab === tab.id ? "#fff" : COLORS.textSecondary,
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Scan VIN button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 16px",
            background: COLORS.accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <QrCode size={16} />
          Scan VIN
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "24px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>
            {TECH.greeting}, {TECH.name} 👋
          </h1>
          <div style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>{TECH.day}</div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <StatCard label="Jobs Today" value="3" sub="1 active now" />
          <StatCard label="Completed" value="1" sub="of 4 assigned" />
          <StatCard label="Efficiency" value="89%" sub="+4% vs avg" />
        </div>

        {/* Active / queued jobs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {DEMO_JOBS.map((job) => (
            <JobCard key={job.id} job={job} onOpenDVI={onOpenDVI} />
          ))}
        </div>

        {/* Completed section (collapsible) */}
        <div style={{ marginTop: 28 }}>
          <button
            onClick={() => setCompletedOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.textSecondary,
            }}
          >
            {completedOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Completed Today (1)
          </button>

          {completedOpen && (
            <div style={{ marginTop: 10 }}>
              {COMPLETED_JOBS.map((job) => (
                <JobCard key={job.id} job={job} onOpenDVI={onOpenDVI} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
