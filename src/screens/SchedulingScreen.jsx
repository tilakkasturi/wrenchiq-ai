import { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Zap,
  ChevronRight,
  User,
  CheckCircle,
  Wrench,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import {
  repairOrders,
  technicians,
  bayStatus,
  scheduleSlots,
  getCustomer,
  getVehicle,
  getTech,
  SHOP,
} from "../data/demoData";

// ── Grid Constants ──────────────────────────────────────────
const GRID_START_HOUR = 7;
const GRID_END_HOUR   = 18;
const HOUR_HEIGHT     = 60;
const TOTAL_HOURS     = GRID_END_HOUR - GRID_START_HOUR; // 11
const GRID_HEIGHT     = TOTAL_HOURS * HOUR_HEIGHT;       // 660px
const CURRENT_HOUR    = 12;
const CURRENT_MINUTE  = 0;

// ── Helpers ────────────────────────────────────────────────
function parseTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(" ");
  const [timePart, period] = [parts[0], parts[1]];
  const colonIdx = timePart.indexOf(":");
  let hours = parseInt(timePart.slice(0, colonIdx), 10);
  let minutes = parseInt(timePart.slice(colonIdx + 1), 10) || 0;
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function timeToTop(hours, minutes) {
  return (hours - GRID_START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
}

function durationToHeight(startH, startM, endH, endM) {
  const startTotal = startH * 60 + startM;
  const endTotal   = endH * 60 + endM;
  return ((endTotal - startTotal) / 60) * HOUR_HEIGHT;
}

// ── Static Data ────────────────────────────────────────────
const BAY_UTILIZATION = [
  { bay: 1, pct: 75, techName: "James K.",  status: "In Use",        statusColor: COLORS.accent  },
  { bay: 2, pct: 85, techName: "Mike R.",    status: "In Use",        statusColor: COLORS.accent  },
  { bay: 3, pct: 60, techName: "Carlos M.",  status: "In Use",        statusColor: COLORS.accent  },
  { bay: 4, pct: 25, techName: "Lisa N.",    status: "Starting Soon", statusColor: COLORS.warning },
  { bay: 5, pct: 0,  techName: "\u2014",     status: "Available",     statusColor: COLORS.success },
  { bay: 6, pct: 0,  techName: "\u2014",     status: "Available",     statusColor: COLORS.success },
];

const APPOINTMENTS = [
  {
    bay: 1,
    customer: "Monica Rodriguez",
    vehicle: "Camry",
    service: "60K Service",
    techInitials: "MR",
    startTime: "8:00 AM",
    endTime: "3:00 PM",
    color: "#FF6B35",
  },
  {
    bay: 2,
    customer: "David Kim",
    vehicle: "CR-V",
    service: "CEL + 90K",
    techInitials: "MR",
    startTime: "8:30 AM",
    endTime: "4:00 PM",
    color: "#3B82F6",
  },
  {
    bay: 3,
    customer: "James Park",
    vehicle: "BMW X3",
    service: "Brake Noise",
    techInitials: "JK",
    startTime: "9:00 AM",
    endTime: "4:00 PM",
    color: "#8B5CF6",
  },
  {
    bay: 4,
    customer: "Tom Wallace",
    vehicle: "Tucson",
    service: "Oil Change",
    techInitials: "LN",
    startTime: "10:00 AM",
    endTime: "12:30 PM",
    color: "#10B981",
  },
];

const BAY_HEADER_INFO = [
  { bay: 1, techName: "Mike Reeves",    utilPct: 75 },
  { bay: 2, techName: "Mike Reeves",    utilPct: 85 },
  { bay: 3, techName: "James Kowalski", utilPct: 60 },
  { bay: 4, techName: "Lisa Nguyen",    utilPct: 25 },
  { bay: 5, techName: "Available",      utilPct: 0  },
  { bay: 6, techName: "Available",      utilPct: 0  },
];

const TECH_SUMMARY = [
  {
    name: "James Kowalski",
    initials: "JK",
    role: "Master Tech",
    hoursScheduled: 7,
    hoursAvailable: 8,
    efficiency: 96,
    jobs: 1,
    dotColor: COLORS.accent,
  },
  {
    name: "Mike Reeves",
    initials: "MR",
    role: "Journeyman",
    hoursScheduled: 7.5,
    hoursAvailable: 8,
    efficiency: 85,
    jobs: 2,
    dotColor: COLORS.accent,
  },
  {
    name: "Carlos Mendez",
    initials: "CM",
    role: "Journeyman",
    hoursScheduled: 0,
    hoursAvailable: 8,
    efficiency: 92,
    jobs: 0,
    dotColor: COLORS.success,
  },
  {
    name: "Lisa Nguyen",
    initials: "LN",
    role: "Apprentice",
    hoursScheduled: 2.5,
    hoursAvailable: 8,
    efficiency: 78,
    jobs: 1,
    dotColor: COLORS.warning,
  },
];

// ── Sub-components ──────────────────────────────────────────

function BayUtilizationBars({ data }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: "1px solid " + COLORS.border,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Wrench size={15} color={COLORS.primary} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.textPrimary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Bay Utilization — Today
        </span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {data.map((b) => {
          const barColor =
            b.pct === 0
              ? COLORS.success
              : b.pct >= 70
              ? COLORS.accent
              : COLORS.warning;
          return (
            <div key={b.bay} style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  Bay {b.bay}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: barColor,
                  }}
                >
                  {b.pct}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  background: COLORS.borderLight,
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    width: b.pct + "%",
                    height: "100%",
                    background: barColor,
                    borderRadius: 4,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {b.techName}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: b.statusColor,
                  marginTop: 1,
                }}
              >
                {b.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentBlock({ appt }) {
  const [hovered, setHovered] = useState(false);
  const start = parseTime(appt.startTime);
  const end   = parseTime(appt.endTime);
  if (!start || !end) return null;

  const top    = timeToTop(start.hours, start.minutes);
  const height = durationToHeight(start.hours, start.minutes, end.hours, end.minutes);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        top: top,
        left: 4,
        right: 4,
        height: height - 3,
        background: hovered ? appt.color + "33" : appt.color + "1A",
        borderLeft: "3px solid " + appt.color,
        borderRadius: 6,
        padding: "6px 8px",
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: hovered
          ? "0 4px 14px " + appt.color + "44"
          : "0 1px 3px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.15s ease, background 0.15s ease",
        zIndex: 2,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: appt.color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {appt.customer}
      </div>
      <div
        style={{
          fontSize: 10,
          color: COLORS.textSecondary,
          marginTop: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {appt.vehicle}
      </div>
      {height > 60 && (
        <div
          style={{
            fontSize: 10,
            color: COLORS.textMuted,
            marginTop: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {appt.service}
        </div>
      )}
      {height > 90 && (
        <div
          style={{
            marginTop: 5,
            display: "inline-block",
            background: appt.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 10,
            padding: "1px 7px",
          }}
        >
          {appt.techInitials}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 5,
          right: 6,
          fontSize: 9,
          color: appt.color + "AA",
          fontWeight: 600,
        }}
      >
        {appt.startTime} \u2013 {appt.endTime}
      </div>
    </div>
  );
}

function AISuggestionBlock() {
  const top    = timeToTop(10, 0);
  const height = durationToHeight(10, 0, 11, 30);

  return (
    <div
      style={{
        position: "absolute",
        top: top,
        left: 4,
        right: 4,
        height: height - 3,
        border: "2px dashed " + COLORS.warning,
        borderRadius: 6,
        padding: "6px 8px",
        background: COLORS.warning + "0D",
        zIndex: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.warning,
          display: "flex",
          alignItems: "center",
          gap: 3,
          marginBottom: 3,
        }}
      >
        <Zap size={10} />
        AI Suggestion
      </div>
      <div
        style={{
          fontSize: 9,
          color: COLORS.textSecondary,
          lineHeight: 1.45,
        }}
      >
        Robert Taylor's F-150
        <br />
        Oil + Tire Rotation
        <br />
        1.5 hr \u2022 10AM\u201311:30AM
        <br />
        <strong style={{ color: COLORS.warning }}>Assign Lisa N.</strong>
      </div>
    </div>
  );
}

function CurrentTimeLine() {
  const top = timeToTop(CURRENT_HOUR, CURRENT_MINUTE);
  return (
    <div
      style={{
        position: "absolute",
        top: top,
        left: 0,
        right: 0,
        zIndex: 10,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: COLORS.danger,
          flexShrink: 0,
          marginLeft: -4,
        }}
      />
      <div
        style={{
          flex: 1,
          height: 2,
          background: COLORS.danger,
          opacity: 0.8,
        }}
      />
    </div>
  );
}

function ScheduleGrid({ appointments }) {
  const hourLabels = [];
  for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) {
    let label;
    if (h === 12) label = "12 PM";
    else if (h > 12) label = h - 12 + " PM";
    else label = h + " AM";
    hourLabels.push({ h, label });
  }

  const bays = [1, 2, 3, 4, 5, 6];

  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: "1px solid " + COLORS.border,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* Time column */}
      <div
        style={{
          width: 58,
          flexShrink: 0,
          borderRight: "1px solid " + COLORS.border,
        }}
      >
        {/* Header spacer */}
        <div
          style={{
            height: 54,
            borderBottom: "1px solid " + COLORS.border,
            background: COLORS.primary + "08",
          }}
        />
        {/* Hour labels */}
        <div style={{ position: "relative", height: GRID_HEIGHT }}>
          {hourLabels.map(({ h, label }) => {
            const top = (h - GRID_START_HOUR) * HOUR_HEIGHT;
            const isCurrent = h === CURRENT_HOUR;
            return (
              <div
                key={h}
                style={{
                  position: "absolute",
                  top: top,
                  left: 0,
                  right: 0,
                  paddingRight: 8,
                  textAlign: "right",
                  transform: "translateY(-8px)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? COLORS.danger : COLORS.textMuted,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bay columns — horizontally scrollable on small screens */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minWidth: 0,
          overflowX: "auto",
        }}
      >
        {bays.map((bay, idx) => {
          const hdr   = BAY_HEADER_INFO.find((b) => b.bay === bay);
          const appt  = appointments.find((a) => a.bay === bay);
          const open  = !appt;
          const utilColor =
            hdr.utilPct === 0
              ? COLORS.success
              : hdr.utilPct >= 70
              ? COLORS.accent
              : COLORS.warning;

          return (
            <div
              key={bay}
              style={{
                flex: 1,
                minWidth: 110,
                borderRight:
                  idx < bays.length - 1
                    ? "1px solid " + COLORS.borderLight
                    : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Bay header */}
              <div
                style={{
                  height: 54,
                  borderBottom: "1px solid " + COLORS.border,
                  background: open
                    ? COLORS.success + "10"
                    : COLORS.primary + "08",
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  Bay {bay}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textSecondary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {hdr.techName}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: utilColor,
                  }}
                >
                  {open ? "Open" : hdr.utilPct + "% util."}
                </div>
              </div>

              {/* Bay body */}
              <div
                style={{
                  position: "relative",
                  height: GRID_HEIGHT,
                  flex: 1,
                }}
              >
                {/* Hour grid lines */}
                {hourLabels.map(({ h }) => (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      top: (h - GRID_START_HOUR) * HOUR_HEIGHT,
                      left: 0,
                      right: 0,
                      borderTop: "1px solid " + COLORS.borderLight,
                      pointerEvents: "none",
                    }}
                  />
                ))}

                {/* Half-hour lines */}
                {hourLabels.map(({ h }) => (
                  <div
                    key={h + ".5"}
                    style={{
                      position: "absolute",
                      top: (h - GRID_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                      left: 0,
                      right: 0,
                      borderTop: "1px dashed " + COLORS.borderLight,
                      opacity: 0.6,
                      pointerEvents: "none",
                    }}
                  />
                ))}

                {/* Appointment block */}
                {appt && <AppointmentBlock appt={appt} />}

                {/* AI suggestion — Bay 5 */}
                {bay === 5 && <AISuggestionBlock />}

                {/* Hatch pattern — Bay 6 open all day */}
                {bay === 6 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 8px, " +
                        COLORS.borderLight +
                        " 8px, " +
                        COLORS.borderLight +
                        " 9px)",
                      opacity: 0.6,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Current time line */}
                <CurrentTimeLine />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIOptimizationPanel({ onApply, applied }) {
  return (
    <div
      style={{
        background: COLORS.primary,
        borderRadius: 12,
        padding: "18px 20px",
        marginTop: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: COLORS.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap size={15} color="#fff" />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          WrenchIQ AI suggests 2 optimizations
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Suggestion 1 */}
        <div
          style={{
            background: "rgba(255,255,255,0.09)",
            borderRadius: 8,
            padding: "12px 14px",
            borderLeft: "3px solid " + COLORS.accent,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: COLORS.accent,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              1
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 3,
                }}
              >
                Bay 5 has 10AM\u201311:30AM slot open
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.5,
                }}
              >
                Robert Taylor's F-150 (oil change + tire rotation, 1.5 hr) fits
                perfectly. Assign Lisa Nguyen.{" "}
                <span
                  style={{
                    fontWeight: 700,
                    color: COLORS.success,
                  }}
                >
                  Est. $395 additional revenue.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion 2 */}
        <div
          style={{
            background: "rgba(255,255,255,0.09)",
            borderRadius: 8,
            padding: "12px 14px",
            borderLeft: "3px solid " + COLORS.warning,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: COLORS.warning,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              2
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 3,
                }}
              >
                Move Angela Martinez's head gasket assessment to today
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.5,
                }}
              >
                Scheduled for tomorrow but Bay 6 is open and Carlos M. is available
                2PM\u20134PM today. Assessment only (\u223c2.3 hr) \u2014 no parts
                needed.
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onApply}
        disabled={applied}
        style={{
          marginTop: 14,
          background: applied ? COLORS.success : COLORS.accent,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 13,
          fontWeight: 700,
          cursor: applied ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: applied ? 0.85 : 1,
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!applied) e.currentTarget.style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          if (!applied) e.currentTarget.style.opacity = "1";
        }}
      >
        {applied ? (
          <>
            <CheckCircle size={14} />
            Suggestions Applied
          </>
        ) : (
          <>
            Apply Suggestions
            <ChevronRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}

function TechCard({ tech }) {
  const hoursRemaining = tech.hoursAvailable - tech.hoursScheduled;
  const utilPct =
    tech.hoursAvailable > 0
      ? Math.round((tech.hoursScheduled / tech.hoursAvailable) * 100)
      : 0;
  const effColor =
    tech.efficiency >= 90
      ? COLORS.success
      : tech.efficiency >= 80
      ? COLORS.warning
      : COLORS.danger;

  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: "1px solid " + COLORS.border,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      {/* Avatar + name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: COLORS.primary,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {tech.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {tech.name}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
            {tech.role}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: tech.dotColor,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Stat tiles */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 10,
        }}
      >
        {[
          {
            value: tech.hoursScheduled + "h",
            label: "Scheduled",
            highlight: false,
          },
          {
            value: hoursRemaining.toFixed(1) + "h",
            label: "Available",
            highlight: hoursRemaining > 2,
            color: COLORS.success,
          },
          {
            value: tech.jobs,
            label: "Jobs",
            highlight: false,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: COLORS.bg,
              borderRadius: 6,
              padding: "6px 4px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color:
                  stat.highlight && stat.color
                    ? stat.color
                    : COLORS.textPrimary,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 9, color: COLORS.textMuted }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Efficiency bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
          Efficiency
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: effColor }}>
          {tech.efficiency}%
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 5,
          background: COLORS.borderLight,
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: tech.efficiency + "%",
            height: "100%",
            background: effColor,
            borderRadius: 3,
          }}
        />
      </div>

      {/* Utilization bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
          Bay utilization
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: utilPct > 0 ? COLORS.accent : COLORS.textMuted,
          }}
        >
          {utilPct}%
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 5,
          background: COLORS.borderLight,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: utilPct + "%",
            height: "100%",
            background: utilPct > 0 ? COLORS.accent : COLORS.borderLight,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

// ── Main Screen Component ───────────────────────────────────
export default function SchedulingScreen() {
  const [aiApplied, setAiApplied] = useState(false);
  const [toast, setToast]         = useState(false);

  function handleApply() {
    setAiApplied(true);
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }

  return (
    <div
      style={{
        flex: 1,
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        padding: "24px 24px 32px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
      }}
    >
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 22,
            right: 22,
            zIndex: 9999,
            background: COLORS.primary,
            color: "#fff",
            borderRadius: 10,
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
          }}
        >
          <CheckCircle size={16} color={COLORS.success} />
          AI suggestions applied to schedule
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: COLORS.textPrimary,
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Bay Scheduler
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 5,
            }}
          >
            <Calendar size={14} color={COLORS.textSecondary} />
            <span
              style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                fontWeight: 500,
              }}
            >
              Friday, November 15, 2024
            </span>
            <span
              style={{
                marginLeft: 4,
                background: COLORS.success + "1E",
                color: COLORS.success,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 10,
                padding: "2px 8px",
                letterSpacing: "0.04em",
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: COLORS.bgCard,
              border: "1px solid " + COLORS.border,
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              color: COLORS.textSecondary,
              fontWeight: 500,
            }}
          >
            <Clock size={14} />
            12:00 PM
          </div>
          <button
            style={{
              background: COLORS.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={14} />
            Schedule Appointment
          </button>
        </div>
      </div>

      {/* ── BAY UTILIZATION ─────────────────────────────── */}
      <BayUtilizationBars data={BAY_UTILIZATION} />

      {/* ── MAIN CONTENT: grid + right sidebar ──────────── */}
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left column: grid + AI panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              overflowY: "auto",
              maxHeight: "calc(100vh - 330px)",
              borderRadius: 12,
            }}
          >
            <ScheduleGrid appointments={APPOINTMENTS} />
          </div>
          <AIOptimizationPanel onApply={handleApply} applied={aiApplied} />
        </div>

        {/* Right column: tech summary */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              background: COLORS.bgCard,
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              padding: "14px 14px 4px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 14,
              }}
            >
              <User size={14} color={COLORS.primary} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Tech Summary
              </span>
            </div>
            {TECH_SUMMARY.map((tech) => (
              <TechCard key={tech.initials} tech={tech} />
            ))}
          </div>

          {/* Shop stats */}
          <div
            style={{
              background: COLORS.bgCard,
              border: "1px solid " + COLORS.border,
              borderRadius: 12,
              padding: "14px 14px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.textPrimary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
            >
              Shop Stats \u2014 Today
            </div>
            {[
              { label: "Active Bays",          value: "4 / 6",  color: COLORS.accent   },
              { label: "Avg Utilization",       value: "57.5%",  color: COLORS.warning  },
              { label: "Open Revenue Slots",    value: "2",      color: COLORS.success  },
              { label: "Est. Day Revenue",      value: "$4,066", color: COLORS.primary  },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 9,
                }}
              >
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: row.color,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* AI status badge */}
          <div
            style={{
              background: COLORS.primary + "0E",
              border: "1px solid " + COLORS.primary + "30",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Zap size={14} color={COLORS.accent} />
            <span
              style={{
                fontSize: 12,
                color: COLORS.primary,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {aiApplied
                ? "2 AI suggestions applied. Bay 5 scheduled."
                : "2 AI scheduling suggestions pending review."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
