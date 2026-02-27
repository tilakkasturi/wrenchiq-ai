import { useState } from "react";
import { COLORS } from "../theme/colors";
import {
  repairOrders,
  getCustomer,
  getVehicle,
  getTech,
  SHOP,
} from "../data/demoData";
import {
  Plus,
  Brain,
  Clock,
  CheckCircle,
  Search,
  Filter,
  ChevronRight,
  Wrench,
  Car,
  User,
  Calendar,
} from "lucide-react";

// ── Column definitions ──────────────────────────────────────
const COLUMNS = [
  {
    id: "checked_in",
    label: "Checked In",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  {
    id: "inspecting",
    label: "Inspecting",
    color: "#F97316",
    bgColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  {
    id: "estimate_sent",
    label: "Estimate Sent",
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  {
    id: "approved",
    label: "Approved",
    color: "#0D9488",
    bgColor: "#F0FDFA",
    borderColor: "#99F6E4",
  },
  {
    id: "in_progress",
    label: "In Progress",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  {
    id: "ready",
    label: "Ready",
    color: "#16A34A",
    bgColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
];

// ── Helpers ─────────────────────────────────────────────────
function getWaitingHours(waitingSince) {
  if (!waitingSince) return 0;
  const sent = new Date(waitingSince);
  const now = new Date("2024-11-15T12:00:00"); // demo "now"
  const diff = (now - sent) / (1000 * 60 * 60);
  return Math.round(diff * 10) / 10;
}

function getOemBadgeLabel(ro) {
  if (!ro.isOemService) return null;
  if (ro.oemMilestone) {
    if (ro.oemMilestone.includes("60,000")) return "OEM 60K";
    if (ro.oemMilestone.includes("90,000")) return "OEM 90K";
    if (ro.oemMilestone.includes("80,000")) return "OEM 80K";
    return "OEM";
  }
  return "OEM";
}

// ── RO Card ─────────────────────────────────────────────────
function ROCard({ ro, column }) {
  const customer = getCustomer(ro.customerId);
  const vehicle = getVehicle(ro.vehicleId);
  const tech = getTech(ro.techId);

  const vinLast6 = vehicle ? vehicle.vin.slice(-6) : "------";
  const oemBadge = getOemBadgeLabel(ro);
  const waitingHrs =
    ro.status === "estimate_sent" ? getWaitingHours(ro.waitingSince) : null;
  const aiCount = ro.aiInsights ? ro.aiInsights.length : 0;
  const showProgress = ro.status === "in_progress";

  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${hovered ? column.color : COLORS.border}`,
        borderLeft: `3px solid ${column.color}`,
        borderRadius: 8,
        padding: "12px 12px 10px",
        marginBottom: 10,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered
          ? "0 4px 12px rgba(0,0,0,0.10)"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top row: RO number + badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: COLORS.textMuted,
            letterSpacing: "0.04em",
            fontFamily: "monospace",
          }}
        >
          {ro.id}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {oemBadge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#1D4ED8",
                background: "#DBEAFE",
                border: "1px solid #93C5FD",
                borderRadius: 4,
                padding: "1px 6px",
                letterSpacing: "0.03em",
              }}
            >
              {oemBadge}
            </span>
          )}
          {aiCount > 0 && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                fontWeight: 600,
                color: "#7C3AED",
                background: "#EDE9FE",
                border: "1px solid #C4B5FD",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              <Brain size={10} />
              {aiCount}
            </span>
          )}
        </div>
      </div>

      {/* Customer name */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: COLORS.textPrimary,
          marginBottom: 2,
          lineHeight: 1.3,
        }}
      >
        {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown"}
      </div>

      {/* Vehicle */}
      {vehicle && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 2,
          }}
        >
          <Car size={11} color={COLORS.textMuted} />
          <span
            style={{
              fontSize: 12,
              color: COLORS.textSecondary,
              lineHeight: 1.3,
            }}
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
          </span>
        </div>
      )}

      {/* VIN last 6 */}
      {vehicle && (
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: COLORS.textMuted,
              background: COLORS.borderLight,
              borderRadius: 3,
              padding: "1px 5px",
              letterSpacing: "0.08em",
            }}
          >
            &bull;&bull;&bull;{vinLast6}
          </span>
        </div>
      )}

      {/* Service type */}
      <div
        style={{
          fontSize: 11,
          color: COLORS.textSecondary,
          marginBottom: 8,
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Wrench size={10} color={COLORS.textMuted} style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ro.serviceType}
        </span>
      </div>

      {/* Progress bar (in_progress only) */}
      {showProgress && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>
              Progress
            </span>
            <span
              style={{ fontSize: 10, fontWeight: 600, color: column.color }}
            >
              {ro.progress}%
            </span>
          </div>
          <div
            style={{
              height: 5,
              background: COLORS.borderLight,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${ro.progress}%`,
                background: `linear-gradient(90deg, ${column.color}, ${column.color}CC)`,
                borderRadius: 3,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Waiting timer (estimate_sent) */}
      {waitingHrs !== null && waitingHrs > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 5,
            padding: "3px 7px",
          }}
        >
          <Clock size={11} color="#D97706" />
          <span
            style={{
              fontSize: 11,
              color: "#92400E",
              fontWeight: 600,
            }}
          >
            Waiting {waitingHrs} hrs
          </span>
        </div>
      )}

      {/* Footer: tech + estimate */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          borderTop: `1px solid ${COLORS.borderLight}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: tech ? column.bgColor : COLORS.borderLight,
              border: `1px solid ${tech ? column.borderColor : COLORS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: tech ? column.color : COLORS.textMuted,
            }}
          >
            {tech ? (
              tech.initials
            ) : (
              <User size={10} color={COLORS.textMuted} />
            )}
          </div>
          <span
            style={{
              fontSize: 11,
              color: tech ? COLORS.textSecondary : COLORS.textMuted,
              fontStyle: tech ? "normal" : "italic",
            }}
          >
            {tech ? tech.name.split(" ")[0] : "Unassigned"}
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          ${ro.totalEstimate != null ? ro.totalEstimate.toLocaleString() : "—"}
        </span>
      </div>
    </div>
  );
}

// ── Kanban Column ────────────────────────────────────────────
function KanbanColumn({ column, ros }) {
  const columnTotal = ros.reduce((sum, ro) => sum + (ro.totalEstimate || 0), 0);

  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 210,
        maxWidth: 280,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Column header */}
      <div
        style={{
          background: column.bgColor,
          border: `1px solid ${column.borderColor}`,
          borderRadius: "8px 8px 0 0",
          padding: "10px 12px 8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: column.color,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {column.label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.bgCard,
              background: column.color,
              borderRadius: 10,
              padding: "1px 8px",
              minWidth: 22,
              textAlign: "center",
            }}
          >
            {ros.length}
          </span>
        </div>
        {ros.length > 0 && (
          <div style={{ fontSize: 10, color: column.color, fontWeight: 500 }}>
            ${columnTotal.toLocaleString()} est.
          </div>
        )}
      </div>

      {/* Cards area */}
      <div
        style={{
          flex: 1,
          background: column.bgColor + "55",
          border: `1px solid ${column.borderColor}`,
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          padding: "10px 8px 8px",
          minHeight: 200,
        }}
      >
        {ros.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px 12px",
              color: COLORS.textMuted,
            }}
          >
            <CheckCircle
              size={22}
              style={{ marginBottom: 6, opacity: 0.4 }}
              color={column.color}
            />
            <div style={{ fontSize: 11, fontStyle: "italic" }}>No ROs</div>
          </div>
        ) : (
          ros.map((ro) => <ROCard key={ro.id} ro={ro} column={column} />)
        )}
      </div>
    </div>
  );
}

// ── Scheduled Section ────────────────────────────────────────
function ScheduledSection({ scheduledROs }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Calendar size={16} color={COLORS.textSecondary} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          Scheduled
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textMuted,
            background: COLORS.borderLight,
            borderRadius: 10,
            padding: "1px 8px",
          }}
        >
          {scheduledROs.length}
        </span>
      </div>

      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr 1fr 1fr 130px 90px 32px",
            background: COLORS.borderLight,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "8px 16px",
            gap: 8,
          }}
        >
          {["RO #", "Customer", "Vehicle", "Service", "Date", "Est.", ""].map(
            (h, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textMuted,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            )
          )}
        </div>

        {/* Table rows */}
        {scheduledROs.map((ro, idx) => {
          const customer = getCustomer(ro.customerId);
          const vehicle = getVehicle(ro.vehicleId);
          const tech = getTech(ro.techId);
          const isLast = idx === scheduledROs.length - 1;

          const scheduledDateObj = ro.scheduledDate
            ? new Date(ro.scheduledDate)
            : null;
          const scheduledStr = scheduledDateObj
            ? scheduledDateObj.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "—";

          return (
            <div
              key={ro.id}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 1fr 1fr 130px 90px 32px",
                gap: 8,
                padding: "10px 16px",
                borderBottom: isLast
                  ? "none"
                  : `1px solid ${COLORS.borderLight}`,
                alignItems: "center",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = COLORS.borderLight)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* RO number */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: COLORS.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  {ro.id}
                </span>
                {ro.isOemService && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#1D4ED8",
                      background: "#DBEAFE",
                      borderRadius: 3,
                      padding: "1px 5px",
                    }}
                  >
                    OEM
                  </span>
                )}
              </div>

              {/* Customer */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {customer
                    ? `${customer.firstName} ${customer.lastName}`
                    : "—"}
                </div>
                {tech && (
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                    Tech: {tech.name.split(" ")[0]}
                  </div>
                )}
              </div>

              {/* Vehicle */}
              <div>
                {vehicle ? (
                  <>
                    <div
                      style={{ fontSize: 12, color: COLORS.textSecondary }}
                    >
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: COLORS.textMuted,
                      }}
                    >
                      &bull;&bull;&bull;{vehicle.vin.slice(-6)}
                    </div>
                  </>
                ) : (
                  <span style={{ color: COLORS.textMuted }}>—</span>
                )}
              </div>

              {/* Service */}
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ro.serviceType}
              </div>

              {/* Date */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                }}
              >
                <Calendar size={11} color={COLORS.textMuted} />
                {scheduledStr}
              </div>

              {/* Estimate */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                $
                {ro.totalEstimate != null
                  ? ro.totalEstimate.toLocaleString()
                  : "—"}
              </div>

              {/* Chevron */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ChevronRight size={15} color={COLORS.textMuted} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Filter Pill ──────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: 20,
        border: active
          ? `1.5px solid ${COLORS.primary}`
          : `1px solid ${COLORS.border}`,
        background: active ? COLORS.primary : COLORS.bgCard,
        color: active ? "#FFFFFF" : COLORS.textSecondary,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Main Screen ─────────────────────────────────────────────
export default function RepairOrderScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const kanbanStatuses = [
    "checked_in",
    "inspecting",
    "estimate_sent",
    "approved",
    "in_progress",
    "ready",
  ];

  const kanbanROs = repairOrders.filter((ro) =>
    kanbanStatuses.includes(ro.status)
  );
  const scheduledROs = repairOrders.filter((ro) => ro.status === "scheduled");

  // Apply filter + search
  const filterROs = (ros) => {
    let filtered = ros;

    if (activeFilter === "OEM Services") {
      filtered = filtered.filter((ro) => ro.isOemService);
    } else if (activeFilter === "Today") {
      // demo today = 2024-11-15
      filtered = filtered.filter(
        (ro) =>
          (ro.dateIn && ro.dateIn.startsWith("2024-11-15")) ||
          (ro.scheduledDate && ro.scheduledDate.startsWith("2024-11-15"))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((ro) => {
        const customer = getCustomer(ro.customerId);
        const vehicle = getVehicle(ro.vehicleId);
        const custName = customer
          ? `${customer.firstName} ${customer.lastName}`.toLowerCase()
          : "";
        const vehStr = vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase()
          : "";
        return (
          ro.id.toLowerCase().includes(q) ||
          custName.includes(q) ||
          vehStr.includes(q) ||
          ro.serviceType.toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  };

  const filteredKanbanROs = filterROs(kanbanROs);
  const filteredScheduled = filterROs(scheduledROs);
  const totalCount = repairOrders.length;
  const kanbanCount = kanbanROs.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: COLORS.bg,
        overflow: "hidden",
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 24px 0",
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                Repair Orders
              </h1>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.primary,
                  background: "#E0F0F3",
                  borderRadius: 12,
                  padding: "2px 10px",
                }}
              >
                {totalCount} total
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  background: COLORS.borderLight,
                  borderRadius: 12,
                  padding: "2px 10px",
                }}
              >
                {kanbanCount} active
              </span>
            </div>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: COLORS.textMuted,
              }}
            >
              {SHOP.name} &mdash; Today
            </p>
          </div>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              background: COLORS.accent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(255,107,53,0.30)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#E85D2B")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = COLORS.accent)
            }
          >
            <Plus size={15} />
            New Repair Order
          </button>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: COLORS.textMuted,
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search ROs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 30,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                fontSize: 12,
                color: COLORS.textPrimary,
                background: COLORS.bg,
                width: 180,
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              width: 1,
              height: 22,
              background: COLORS.border,
            }}
          />

          {["All", "Today", "OEM Services"].map((f) => (
            <FilterPill
              key={f}
              label={f}
              active={activeFilter === f}
              onClick={() => setActiveFilter(f)}
            />
          ))}

          <div style={{ marginLeft: "auto" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                background: COLORS.bgCard,
                color: COLORS.textSecondary,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Filter size={12} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ───────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          padding: "20px 24px 32px",
        }}
      >
        {/* Kanban board */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            minWidth: "fit-content",
          }}
        >
          {COLUMNS.map((column) => {
            const columnROs = filteredKanbanROs.filter(
              (ro) => ro.status === column.id
            );
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                ros={columnROs}
              />
            );
          })}
        </div>

        {/* Scheduled section */}
        {filteredScheduled.length > 0 && (
          <ScheduledSection scheduledROs={filteredScheduled} />
        )}
      </div>
    </div>
  );
}
