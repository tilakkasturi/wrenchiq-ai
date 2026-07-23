/**
 * WrenchIQSidecarScreen — Surface B (Tauri): WrenchIQ Intelligence sidecar
 *
 * Narrow, single-purpose window: search/select a customer's RO from the
 * live Data Feed (CustomerSelector + SelectedCustomerContext, already
 * polling GET /api/data-feed/*), then automatically load WrenchIQ
 * intelligence for that RO (GET /api/repair-orders/story-ro/:roId for full
 * RO detail, then POST /api/ro-advisor for the advisor brief / service
 * recommendations / alerts). This is intentionally narrow — no Kanban, no
 * shop-wide Knowledge Graph panel. Just: pick a customer, get WrenchIQ
 * intelligence.
 */

import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, Search, Settings, ExternalLink, Bell, BellOff, Clipboard, Send, Check } from "lucide-react";
import { COLORS } from "../theme/colors";
import { useSelectedCustomer } from "../context/SelectedCustomerContext";
import { fetchStoryRO, updateStoryRO } from "../services/repairOrderService";
import { useInsightNotifier } from "../services/insightNotifier";
import CustomerSelector from "../components/CustomerSelector";
import { openExternalUrl } from "../services/externalLink";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const WEB_APP_BASE_URL = import.meta.env.VITE_WEB_APP_BASE_URL || "http://localhost:5173";

function fmtMoney(n) {
  if (n == null) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
}

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

const openSurfaceASettings = () => openExternalUrl(`${WEB_APP_BASE_URL}/admin.html?section=settings&edition=am`);
const openSurfaceC = () => openExternalUrl(`${WEB_APP_BASE_URL}/sms-representative.html`);

export default function WrenchIQSidecarScreen() {
  const { activeCustomer, customers, selectCustomer } = useSelectedCustomer();
  const [storyRO, setStoryRO] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(true);

  const { notifications } = useInsightNotifier(customers);

  useEffect(() => {
    const roId = activeCustomer?.roNumber;
    setStoryRO(null);
    setAgentData(null);

    if (!roId) return;

    let cancelled = false;
    setLoading(true);

    fetchStoryRO(roId)
      .then((ro) => {
        if (cancelled || !ro) return;
        setStoryRO(ro);

        return fetch(`${API_BASE}/api/ro-advisor`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ro: {
              ...ro,
              customerId: ro._customer?.id,
              customerName: [ro._customer?.firstName, ro._customer?.lastName].filter(Boolean).join(" "),
            },
            customer: ro.customer || null,
            vehicle: ro.vehicle || null,
            shopId: ro.shopId,
          }),
        })
          .then((r) => r.json())
          .then((data) => { if (!cancelled) setAgentData(data); });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCustomer?.roNumber]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: COLORS.navyDark, fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 18px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 26, height: 26, background: COLORS.gold,
            borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            WrenchIQ Intelligence
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            <button
              onClick={() => setNotificationsVisible((v) => !v)}
              title={notificationsVisible ? "Hide notifications" : "Show notifications"}
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: notificationsVisible ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
              }}
            >
              {notificationsVisible ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button
              onClick={openSurfaceC}
              title="Open SMS/DMS Representative (Surface C)"
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <ExternalLink size={15} />
            </button>
            <button
              onClick={openSurfaceASettings}
              title="Open WrenchIQ settings"
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
        <CustomerSelector />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        {!activeCustomer && (
          <EmptyState icon={<Search size={18} color="rgba(255,255,255,0.3)" />} text="No active customer in the data feed yet." />
        )}

        {activeCustomer && loading && !storyRO && (
          <LoadingSkeleton />
        )}

        {activeCustomer && !loading && !storyRO && (
          <EmptyState icon={<AlertTriangle size={18} color="rgba(255,255,255,0.3)" />} text={`No RO detail found for ${activeCustomer.roNumber || activeCustomer.customerName}.`} />
        )}

        {storyRO && (
          <IntelligencePanel key={storyRO.roNumber} ro={storyRO} agentData={agentData} agentLoading={loading} />
        )}
      </div>

      {/* Notifications — shop activity while you keep working the selected customer.
          Clicking one loads that customer's RO; toggled via the bell icon above. */}
      {notificationsVisible && notifications.length > 0 && (
        <div style={{ padding: "0 18px 8px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={n.customerId ? () => selectCustomer(n.customerId) : undefined}
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)",
                borderRadius: 8, padding: "7px 10px",
                cursor: n.customerId ? "pointer" : "default",
              }}
              onMouseEnter={(e) => { if (n.customerId) e.currentTarget.style.background = "rgba(34,197,94,0.12)"; }}
              onMouseLeave={(e) => { if (n.customerId) e.currentTarget.style.background = "rgba(34,197,94,0.06)"; }}
            >
              <Sparkles size={11} color="#4ADE80" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#86EFAC" }}>{n.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.35 }}>{n.body}</div>
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", flexShrink: 0, whiteSpace: "nowrap" }}>
                {timeAgo(n.at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "10px 18px 14px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 10, color: "rgba(255,255,255,0.25)",
      }}>
        WrenchIQ reads the shop's data feed — never writes to it
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 10, padding: "48px 16px", textAlign: "center",
    }}>
      {icon}
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {[80, 60, 90, 45].map((w, i) => (
        <div key={i} style={{
          height: 10, borderRadius: 4,
          background: "rgba(34,197,94,0.12)",
          width: `${w}%`,
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }`}</style>
    </div>
  );
}

function StagedCustomerText({ ro }) {
  const [status, setStatus] = useState(ro.agenticTextStatus || "staged");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!ro.agenticCustomerText) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ro.agenticCustomerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function handleSend() {
    setSending(true);
    try {
      await updateStoryRO(ro.roNumber, { agenticTextStatus: "sent" });
      setStatus("sent");
    } catch {
      // best-effort — leave status as-is so the advisor can retry
    } finally {
      setSending(false);
    }
  }

  const sent = status === "sent";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, padding: "11px 13px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Customer Text
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 6px",
          textTransform: "uppercase", letterSpacing: "0.04em",
          background: sent ? "rgba(74,222,128,0.15)" : "rgba(250,204,21,0.12)",
          color: sent ? "#4ADE80" : "#FBBF24",
        }}>
          {sent ? "Sent" : "Staged"}
        </span>
      </div>

      <p style={{ margin: "0 0 9px", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
        {ro.agenticCustomerText}
      </p>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleCopy}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)",
          }}
        >
          {copied ? <Check size={12} color="#4ADE80" /> : <Clipboard size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handleSend}
          disabled={sent || sending}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: sent ? "rgba(74,222,128,0.12)" : COLORS.accent,
            border: "none", borderRadius: 6, padding: "5px 10px",
            cursor: sent || sending ? "default" : "pointer",
            fontSize: 11, fontWeight: 600, color: sent ? "#4ADE80" : "#fff",
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sent ? <Check size={12} /> : <Send size={12} />}
          {sent ? "Sent to Customer" : sending ? "Sending…" : "Send via SMS"}
        </button>
      </div>
    </div>
  );
}

function IntelligencePanel({ ro, agentData, agentLoading }) {
  const cust = ro._customer;
  const veh = ro._vehicle;

  const hasNothing = !agentLoading && !agentData?.advisorBrief
    && (agentData?.serviceRecommendations || []).length === 0
    && (agentData?.alerts || []).length === 0
    && (agentData?.ings || []).length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Customer Repair Order — Name, Concern, Services ───────────── */}
      <div>
        <div style={{
          fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
        }}>
          Customer Repair Order · {fmtMoney(ro.totalEstimate)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Customer / RO card */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 10,
            borderLeft: `3px solid ${COLORS.accent}`,
            padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: COLORS.accent,
                background: "rgba(255,255,255,0.07)", borderRadius: 4,
                padding: "2px 7px", letterSpacing: "0.06em",
              }}>
                {(ro.status || "").replace(/_/g, " ").toUpperCase()}
              </span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                {ro.roNumber}
              </span>
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>
              {cust?.firstName ? `${cust.firstName} ${cust.lastName}` : "Unknown customer"}
            </div>

            {veh?.make && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {veh.year} {veh.make} {veh.model}
              </div>
            )}
          </div>

          {/* Concern */}
          {ro.customerConcern && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "11px 13px",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>
                "{ro.customerConcern}"
              </p>
            </div>
          )}

          {/* Services */}
          {(ro.services || []).length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, overflow: "hidden",
            }}>
              <div style={{
                padding: "8px 13px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Services · {fmtMoney(ro.totalEstimate)}
              </div>
              {ro.services.map((svc, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 13px",
                  borderBottom: i < ro.services.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", flex: 1, marginRight: 8 }}>
                    {svc.name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                    {fmtMoney((svc.laborCost || 0) + (svc.partsCost || 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── WrenchIQ Intelligence — live agent output ──────────────────── */}
      <div style={{
        background: "rgba(34,197,94,0.06)",
        border: `1px solid ${agentLoading ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.18)"}`,
        borderRadius: 8, padding: "12px 14px",
        transition: "border-color 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} color="#4ADE80" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              WrenchIQ Intelligence
            </span>
          </div>
          {agentLoading && (
            <span style={{ fontSize: 10, color: "#86EFAC", opacity: 0.7 }}>Analyzing…</span>
          )}
        </div>

        {agentLoading && !agentData && <LoadingSkeleton />}

        <StagedCustomerText ro={ro} />

        {agentData?.advisorBrief && (
          <div style={{
            fontSize: 12, color: "#86EFAC", lineHeight: 1.55, marginBottom: 10,
            fontStyle: "italic", padding: "8px 10px",
            background: "rgba(34,197,94,0.08)", borderRadius: 6,
          }}>
            {agentData.advisorBrief}
          </div>
        )}

        {agentData?.marginCheck?.status && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 10px", marginBottom: 10, borderRadius: 6,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 6px",
              letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
              background: agentData.marginCheck.status === "on-target" ? "rgba(74,222,128,0.15)"
                : agentData.marginCheck.status === "at-risk" ? "rgba(250,204,21,0.12)" : "rgba(248,113,113,0.15)",
              color: agentData.marginCheck.status === "on-target" ? "#4ADE80"
                : agentData.marginCheck.status === "at-risk" ? "#FBBF24" : "#F87171",
            }}>
              Margin {agentData.marginCheck.status.replace("-", " ")}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {agentData.marginCheck.marginPct}% vs {agentData.marginCheck.target}% target
            </span>
          </div>
        )}

        {agentData?.aroGap?.gapAmount > 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10, lineHeight: 1.45 }}>
            <strong style={{ color: COLORS.accent }}>{fmtMoney(agentData.aroGap.gapAmount)}</strong> below ARO target
            {agentData.aroGap.recommendationsCoverAmount > 0 && (
              <> — these recommendations would close <strong style={{ color: COLORS.accent }}>{fmtMoney(agentData.aroGap.recommendationsCoverAmount)}</strong> of it</>
            )}
          </div>
        )}

        {(agentData?.alerts || []).length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(252,211,77,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Alerts
            </div>
            {agentData.alerts.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < agentData.alerts.length - 1 ? "1px solid rgba(252,211,77,0.08)" : "none",
              }}>
                <AlertTriangle size={11} color="#FCD34D" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {hasNothing && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            No intelligence signals for this RO right now.
          </div>
        )}
      </div>

      {/* ── Service Recommendations — distinct blue panel ──────────────── */}
      {(agentData?.serviceRecommendations || []).length > 0 && (
        <div style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.22)",
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            Service Recommendations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {agentData.serviceRecommendations.map((u, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, padding: "9px 11px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", flex: 1, marginRight: 8 }}>
                    {u.service}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#93C5FD" }}>
                      ~${u.estimatedCost}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
                      background: u.confidence === "high" ? "rgba(74,222,128,0.15)" : "rgba(250,204,21,0.12)",
                      color: u.confidence === "high" ? "#4ADE80" : "#FBBF24",
                    }}>
                      {u.confidence}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.4 }}>
                  {u.reason}
                </div>
                {u.talkTrack && (
                  <div style={{
                    fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5,
                    fontStyle: "italic",
                    borderLeft: "2px solid rgba(59,130,246,0.4)",
                    paddingLeft: 8,
                  }}>
                    "{u.talkTrack}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Strategic Priorities — distinct purple panel ────────────────── */}
      {(agentData?.ings || []).length > 0 && (
        <div style={{
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.22)",
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#D8B4FE", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
            Strategic Priorities
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[...agentData.ings].sort((a, b) => (b.applies ? 1 : 0) - (a.applies ? 1 : 0)).map((ing, i) => (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < agentData.ings.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 5px", flexShrink: 0, marginTop: 2,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  background: ing.applies ? "rgba(216,180,254,0.18)" : "rgba(255,255,255,0.06)",
                  color: ing.applies ? "#D8B4FE" : "rgba(255,255,255,0.35)",
                }}>
                  {ing.applies ? "Applies" : "N/A"}
                </span>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{ing.note}</div>
                  {ing.reason && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.4 }}>{ing.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
