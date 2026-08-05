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
 * so both surfaces show the same repair orders. If the live feed is
 * unavailable, this surface shows a "feed unavailable" state rather than
 * silently substituting a static/simulated dataset — matching how Surface B
 * (WrenchIQSidecarScreen) fails visibly instead of showing fabricated data.
 */

import { useState, useRef, useEffect } from "react";
import { ClipboardList, Stethoscope, FileText, ShoppingCart, CheckSquare, AlertTriangle, ChevronDown, FileSearch, Home } from "lucide-react";
import AdvisorHomeScreen from "./screens/AdvisorHomeScreen";
import Job1IntakeScreen from "./screens/Job1IntakeScreen";
import Job2ThreeCScreen from "./screens/Job2ThreeCScreen";
import Job3UpsellScreen from "./screens/Job3UpsellScreen";
import AM3CStoryWriterScreen from "./screens/AM3CStoryWriterScreen";
import RepairOrderViewerScreen from "./screens/RepairOrderViewerScreen";
import { useDemo, DEMO_SHOPS } from "./context/DemoContext";
import { SelectedCustomerProvider } from "./context/SelectedCustomerContext";
import { useLiveBoardROs } from "./services/liveBoardFeed";
import { COLORS } from "./theme/colors";

// V5 feedback (F1): the representative SMS view should read as Kanban + auto
// queue, full stop — the AI workflow screens (intake, 3C compliance, upsell,
// 3C Story Writer) belong to WrenchIQ, not the third-party SMS this surface
// simulates, and pulled attention from the core demo. Only `core: true`
// sections render in the left nav; the rest stay mounted below (unrouted,
// same convention as SocialInboxScreen) rather than deleted outright.
const NAV_SECTIONS = [
  { id: "advisorHome", label: "RO Kanban / Queue",  icon: ClipboardList, core: true },
  { id: "roViewer",    label: "Repair Order Viewer", icon: FileSearch },
  { id: "job1Intake",  label: "Intake & Diagnosis", icon: Stethoscope },
  { id: "job2ThreeC",  label: "3C Compliance",      icon: FileText },
  { id: "job3Upsell",  label: "Service Recommendations", icon: ShoppingCart },
  { id: "am3cWriter",  label: "3C Story Writer",     icon: CheckSquare },
];

const CORE_NAV_SECTIONS = NAV_SECTIONS.filter((s) => s.core);

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
    shopId: ro.shopId,
    column: KANBAN_STATUS_TO_COLUMN[ro.kanbanStatus || ro.status] || "queue",
    minAgo: syntheticMinAgo(i),
    job: ro.services?.[0]?.name || "Repair Order",
    _liveCustomerName: ro._customer ? `${ro._customer.firstName} ${ro._customer.lastName}` : null,
    _liveVehicle: ro._vehicle || null,
    _liveRO: {
      totalEstimate: ro.totalEstimate,
      customerConcern: ro.customerConcern,
      services: ro.services || [],
      status: ro.kanbanStatus || ro.status,
    },
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
  const { smsName, shopName, smsHeaderColor, activeShopId, setDemo } = useDemo();

  return (
    <SelectedCustomerProvider shopId={activeShopId || "cornerstone"} edition="am">
      <SMSRepresentativeShell
        smsName={smsName}
        shopName={shopName}
        smsHeaderColor={smsHeaderColor}
        activeShopId={activeShopId}
        setDemo={setDemo}
      />
    </SelectedCustomerProvider>
  );
}

// Clicking the shop name switches the active demo shop — same field mapping
// DemoContext's ?demo= query param applies, but triggered from the UI so it
// works without a page reload. Other windows/tabs on the same origin (e.g.
// the WrenchIQ sidecar) pick up the change via DemoContext's storage listener.
function ShopSwitcher({ shopName, activeShopId, setDemo }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectShop(shop) {
    setDemo({
      activeShopId:    shop.id,
      shopName:        shop.shopName,
      ownerName:       shop.ownerName,
      ownerInitials:   shop.ownerInitials,
      smsName:         shop.smsName,
      corporateName:   shop.corporateName,
      primaryCustomer: shop.primaryCustomer,
      smsProvider:     shop.smsProvider,
      advisorName:     shop.advisorName,
    });
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch the active demo shop"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          color: "inherit", font: "inherit", letterSpacing: "inherit",
        }}
      >
        {shopName || "Repair Shop"}
        <ChevronDown size={12} strokeWidth={2.5} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
          minWidth: 220,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 1000,
          overflow: "hidden",
          textAlign: "left",
        }}>
          {Object.values(DEMO_SHOPS).map(shop => (
            <div
              key={shop.id}
              onClick={() => selectShop(shop)}
              style={{
                padding: "9px 12px",
                cursor: "pointer",
                fontSize: 12, fontWeight: 600, letterSpacing: 0,
                color: shop.id === activeShopId ? "#1F6FEB" : "#1F2937",
                background: shop.id === activeShopId ? "rgba(31,111,235,0.08)" : "transparent",
              }}
              onMouseEnter={e => { if (shop.id !== activeShopId) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              onMouseLeave={e => { if (shop.id !== activeShopId) e.currentTarget.style.background = "transparent"; }}
            >
              {shop.shopName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SMSRepresentativeShell({ smsName, shopName, smsHeaderColor, activeShopId, setDemo }) {
  const [activeSection, setActiveSection] = useState(CORE_NAV_SECTIONS[0].id);
  const { ros: liveFullROs, loading: feedLoading } = useLiveBoardROs({ shopId: activeShopId || "cornerstone" });

  const feedUnavailable = !feedLoading && !liveFullROs?.length;
  const kanbanRos       = liveFullROs?.length ? toKanbanCards(liveFullROs) : [];
  const storyWriterROs  = liveFullROs?.length ? toStoryWriterROs(liveFullROs) : undefined;

  function renderActiveSection() {
    if (activeSection === "advisorHome") {
      if (feedLoading) return <FeedStatus text="Loading repair orders from the data feed…" />;
      if (feedUnavailable) return <FeedStatus icon={<AlertTriangle size={18} color={COLORS.textMuted} />} text="Data feed unavailable — no live repair orders to display." />;
      return <AdvisorHomeScreen ros={kanbanRos} />;
    }
    if (activeSection === "roViewer") {
      if (feedLoading) return <FeedStatus text="Loading repair orders from the data feed…" />;
      return <RepairOrderViewerScreen ros={liveFullROs || []} />;
    }
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
        position: "relative",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
      }}>
        <button
          onClick={() => setActiveSection(CORE_NAV_SECTIONS[0].id)}
          disabled={activeSection === CORE_NAV_SECTIONS[0].id}
          title="Back to the RO Queue"
          style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", padding: 4, borderRadius: 6,
            cursor: activeSection === CORE_NAV_SECTIONS[0].id ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: activeSection === CORE_NAV_SECTIONS[0].id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
          }}
        >
          <Home size={14} />
        </button>
        {smsName || "Shop Management System"} · <ShopSwitcher shopName={shopName} activeShopId={activeShopId} setDemo={setDemo} /> (Representative — read-only feed to WrenchIQ)
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left side-nav — only core sections (F1: Kanban + auto queue, full stop) */}
        <div style={{
          width: 190, flexShrink: 0,
          background: "#111827",
          display: "flex", flexDirection: "column",
          padding: "10px 8px", gap: 4,
        }}>
          {CORE_NAV_SECTIONS.map((s) => {
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

function FeedStatus({ icon, text }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 10, padding: "48px 16px", textAlign: "center",
    }}>
      {icon}
      <span style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
