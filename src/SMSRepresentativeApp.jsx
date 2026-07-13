/**
 * SMSRepresentativeApp — standalone shell for the "shop's own SMS/DMS" demo.
 *
 * This is explicitly NOT a WrenchIQ-branded surface. It plays the role of a
 * third-party Shop/Dealer Management System (Tekmetric, Mitchell1, Protractor…)
 * that WrenchIQ observes read-only via the Data Feed Model. It hosts the RO
 * Kanban/Queue board plus the Advisor's operational workflow screens (Intake &
 * Diagnosis, 3C Compliance, Service Recommendations, 3C Story Writer) as
 * separate side-nav sections. The 4 workflow screens render with `showIntelligencePanel={false}`
 * — WrenchIQ intelligence for whatever RO is open here is surfaced exclusively
 * by the separate Surface B sidecar (WrenchIQSidecarScreen.jsx), never inline
 * in this app. The Kanban board has no WrenchIQ panel of its own to hide.
 *
 * Data parity with Surface B: the RO Kanban and 3C Story Writer sections poll
 * the same live Data Feed (useLiveBoardROs → /api/data-feed/customers +
 * /api/repair-orders/story-ro/:roId) that Surface B's CustomerSelector reads,
 * so both surfaces show the same repair orders. Each falls back to its own
 * static/simulated dataset only if the live feed is unavailable.
 */

import { useState } from "react";
import { ClipboardList, Stethoscope, FileText, ShoppingCart, CheckSquare } from "lucide-react";
import AdvisorHomeScreen, { STATIC_BOARD_ROS } from "./screens/AdvisorHomeScreen";
import Job1IntakeScreen from "./screens/Job1IntakeScreen";
import Job2ThreeCScreen from "./screens/Job2ThreeCScreen";
import Job3UpsellScreen from "./screens/Job3UpsellScreen";
import AM3CStoryWriterScreen from "./screens/AM3CStoryWriterScreen";
import { useDemo } from "./context/DemoContext";
import { SelectedCustomerProvider } from "./context/SelectedCustomerContext";
import { useDataFeedSimulator } from "./services/dataFeedSimulator";
import { useLiveBoardROs } from "./services/liveBoardFeed";

const NAV_SECTIONS = [
  { id: "advisorHome", label: "RO Kanban / Queue",  icon: ClipboardList },
  { id: "job1Intake",  label: "Intake & Diagnosis", icon: Stethoscope },
  { id: "job2ThreeC",  label: "3C Compliance",      icon: FileText },
  { id: "job3Upsell",  label: "Service Recommendations", icon: ShoppingCart },
  { id: "am3cWriter",  label: "3C Story Writer",     icon: CheckSquare },
];

const KANBAN_STATUS_TO_COLUMN = {
  checked_in:    "queue",
  inspecting:    "diagnosing",
  in_progress:   "diagnosing",
  estimate_sent: "approval",
  approved:      "pickup",
  closed:        "pickup",
};

const STATUS_LABEL = {
  in_progress: "In Progress", inspecting: "Inspecting", estimate_sent: "Estimate Sent",
  checked_in: "Checked In", approved: "Approved", closed: "Complete",
};

// The seed data's dateIn/updatedAt timestamps are months stale relative to
// "today" in this demo, so a real Date.now() diff reads as an absurd number
// of minutes. The feed is already ordered most-recently-updated-first, so
// approximate a plausible "time in queue" from list position instead.
function syntheticMinAgo(index) {
  return 5 + index * 22;
}

// Adapts a full live RO record into AdvisorHomeScreen's Kanban card shape
function toKanbanCards(fullROs) {
  return fullROs.map((ro, i) => ({
    roNum: ro.roNumber,
    column: KANBAN_STATUS_TO_COLUMN[ro.kanbanStatus || ro.status] || "queue",
    minAgo: syntheticMinAgo(i),
    job: ro.services?.[0]?.name || "Repair Order",
    _liveCustomerName: ro._customer ? `${ro._customer.firstName} ${ro._customer.lastName}` : null,
    _liveVehicle: ro._vehicle || null,
    _liveRO: { totalEstimate: ro.totalEstimate },
  }));
}

// Adapts a full live RO record into AM3CStoryWriterScreen's RO list shape
function toStoryWriterROs(fullROs) {
  return fullROs.map((ro) => ({
    id: ro.roNumber,
    vin: ro._vehicle?.vin || "",
    status: STATUS_LABEL[ro.kanbanStatus || ro.status] || "Pending",
    customerName: ro._customer ? `${ro._customer.firstName} ${ro._customer.lastName}` : "",
    concern: ro.customerConcern || ro.serviceType || "",
    vehicle: ro._vehicle || {},
    services: ro.services || [],
  }));
}

export default function SMSRepresentativeApp() {
  const { smsName, shopName, smsHeaderColor, activeShopId } = useDemo();

  return (
    <SelectedCustomerProvider shopId={activeShopId || "cornerstone"} edition="am">
      <SMSRepresentativeShell
        smsName={smsName}
        shopName={shopName}
        smsHeaderColor={smsHeaderColor}
        activeShopId={activeShopId}
      />
    </SelectedCustomerProvider>
  );
}

function SMSRepresentativeShell({ smsName, shopName, smsHeaderColor, activeShopId }) {
  const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0].id);
  const [simRos] = useDataFeedSimulator(STATIC_BOARD_ROS);
  const { ros: liveFullROs } = useLiveBoardROs({ shopId: activeShopId || "cornerstone" });

  const kanbanRos       = liveFullROs?.length ? toKanbanCards(liveFullROs) : simRos;
  const storyWriterROs  = liveFullROs?.length ? toStoryWriterROs(liveFullROs) : undefined;

  function renderActiveSection() {
    if (activeSection === "advisorHome") return <AdvisorHomeScreen ros={kanbanRos} />;
    if (activeSection === "job1Intake")  return <Job1IntakeScreen showIntelligencePanel={false} />;
    if (activeSection === "job2ThreeC")  return <Job2ThreeCScreen showIntelligencePanel={false} />;
    if (activeSection === "job3Upsell")  return <Job3UpsellScreen showIntelligencePanel={false} />;
    if (activeSection === "am3cWriter")  return <AM3CStoryWriterScreen showIntelligencePanel={false} liveROs={storyWriterROs} />;
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Thin title bar identifying this as the shop's own system, not WrenchIQ */}
      <div style={{
        height: 36, flexShrink: 0,
        background: smsHeaderColor || "#1F2937",
        color: "rgba(255,255,255,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
      }}>
        {smsName || "Shop Management System"} · {shopName || "Repair Shop"} (Representative — read-only feed to WrenchIQ)
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left side-nav */}
        <div style={{
          width: 190, flexShrink: 0,
          background: "#111827",
          display: "flex", flexDirection: "column",
          padding: "10px 8px", gap: 4,
        }}>
          {NAV_SECTIONS.map((s) => {
            const isActive = s.id === activeSection;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: "left",
                }}
              >
                <Icon size={15} strokeWidth={isActive ? 2.4 : 2} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
