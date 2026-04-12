import { useState, useCallback } from "react";
import { COLORS } from "../theme/colors";
import { SHOP } from "../data/demoData";
import {
  X, CreditCard, Banknote, Send, CheckCircle, ChevronDown, ChevronUp,
  Phone, RefreshCw, DollarSign, Lock,
} from "lucide-react";

const TAX_RATE = 0.0925;

function computeTotals(ro, discountAmt) {
  const subtotal = ro.totalLabor + ro.totalParts;
  const shopSupplies = ro.shopSupplies || 0;
  const discounted = Math.max(0, subtotal - discountAmt);
  const tax = (discounted + shopSupplies) * TAX_RATE;
  const total = discounted + shopSupplies + tax;
  return { subtotal, shopSupplies, discounted, tax, total };
}

// ── Customer Pay Page (phone mockup) ────────────────────────
function CustomerPayPage({ ro, vehicle, totals, onPay }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);

  function handlePay() {
    setPaying(true);
    setTimeout(() => onPay(), 1800);
  }

  return (
    <div style={{
      width: 320,
      background: "#F9FAFB",
      border: "2px solid #E5E7EB",
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Phone status bar */}
      <div style={{ background: "#1F2937", height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 60, height: 6, background: "#374151", borderRadius: 3 }} />
      </div>

      {/* Browser bar */}
      <div style={{ background: "#FFFFFF", padding: "8px 12px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 6 }}>
        <Lock size={11} color="#16A34A" />
        <span style={{ fontSize: 11, color: "#6B7280", flex: 1, textAlign: "center" }}>wrenchiq.ai/pay/••••••</span>
      </div>

      {/* Page content */}
      <div style={{ background: "#FFFFFF", padding: "16px 16px 20px" }}>
        {/* Shop header */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>W</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.primary }}>WrenchIQ</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.accent }}>.ai</span>
          </div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{SHOP.name}</div>
        </div>

        {/* Vehicle card */}
        <div style={{ background: "#F3F4F6", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
          </div>
          {vehicle && (
            <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace", marginTop: 1 }}>
              VIN &bull;&bull;&bull;{vehicle.vin.slice(-6)}
            </div>
          )}
        </div>

        {/* Services summary */}
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Services performed</span>
            {expanded ? <ChevronUp size={13} color="#6B7280" /> : <ChevronDown size={13} color="#6B7280" />}
          </button>
          {expanded && (
            <div style={{ marginTop: 6, borderTop: "1px solid #E5E7EB", paddingTop: 6 }}>
              {ro.services.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "#6B7280", flex: 1, paddingRight: 8 }}>{s.name}</span>
                  {(s.laborCost + s.partsCost) > 0 && (
                    <span style={{ fontSize: 10, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>
                      ${(s.laborCost + s.partsCost).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>Subtotal</span>
            <span style={{ fontSize: 11, color: "#374151" }}>${totals.discounted.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>Shop supplies</span>
            <span style={{ fontSize: 11, color: "#374151" }}>${totals.shopSupplies.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>Tax (9.25%)</span>
            <span style={{ fontSize: 11, color: "#374151" }}>${totals.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1.5px solid #111827", paddingTop: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Total Due</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>${totals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={paying}
          style={{
            width: "100%",
            padding: "14px 0",
            background: paying ? "#9CA3AF" : `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: paying ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: paying ? "none" : "0 4px 14px rgba(255,107,53,0.4)",
            transition: "all 0.2s",
          }}
        >
          {paying ? (
            <>
              <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
              Processing...
            </>
          ) : (
            <>
              <Lock size={14} />
              Pay ${totals.total.toFixed(2)}
            </>
          )}
        </button>
        <div style={{ textAlign: "center", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Lock size={10} color="#9CA3AF" />
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>Secure payment by Square</span>
        </div>
      </div>
    </div>
  );
}

// ── Paid Confirmation ────────────────────────────────────────
function PaidConfirmation({ amount, method, roId, onClose }) {
  const xeroInvNum = `INV-${parseInt(roId.replace(/\D/g, "").slice(-4), 10) + 100}`;
  return (
    <div style={{ textAlign: "center", padding: "24px 32px" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "#DCFCE7", border: "2px solid #16A34A",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <CheckCircle size={32} color="#16A34A" />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 4 }}>
        Payment Received
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#16A34A", marginBottom: 4 }}>
        ${amount}
      </div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>
        {method} &mdash; {new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
      </div>

      {/* Integration confirmations */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}>
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle size={13} color="#16A34A" />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D" }}>Square</div>
            <div style={{ fontSize: 10, color: "#166534" }}>Payment processed</div>
          </div>
        </div>
        <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle size={13} color="#2563EB" />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8" }}>Xero</div>
            <div style={{ fontSize: 10, color: "#1E40AF" }}>Posted — {xeroInvNum}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>
        Receipt sent via SMS &amp; email. RO status updated to <strong>Closed / Paid</strong>.
      </div>

      <button
        onClick={onClose}
        style={{
          padding: "10px 32px",
          background: COLORS.primary,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Done
      </button>
    </div>
  );
}

// ── Main CheckoutModal ────────────────────────────────────────
export default function CheckoutModal({ ro, customer, vehicle, onClose, onPaid }) {
  const [payMethod, setPayMethod] = useState("sendLink");
  const [discountType, setDiscountType] = useState("$");
  const [discountValue, setDiscountValue] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [step, setStep] = useState("checkout"); // checkout | waitingLink | customerPage | paid
  const [phone, setPhone] = useState(customer?.phone || "");
  const [paidAmount, setPaidAmount] = useState(null);
  const [paidMethod, setPaidMethod] = useState(null);

  const discountNum = parseFloat(discountValue) || 0;
  const discountAmt = discountType === "%" ? (ro.totalLabor + ro.totalParts) * (discountNum / 100) : discountNum;
  const totals = computeTotals(ro, discountAmt);

  const cashNum = parseFloat(cashAmount) || 0;
  const change = Math.max(0, cashNum - totals.total);

  const handleSendLink = useCallback(() => {
    setStep("waitingLink");
    setTimeout(() => setStep("customerPage"), 1200);
  }, []);

  const handleCustomerPaid = useCallback(() => {
    const amt = totals.total.toFixed(2);
    setPaidAmount(amt);
    setPaidMethod("Apple Pay");
    setStep("paid");
    onPaid(ro.id, amt, "Apple Pay");
  }, [totals.total, ro.id, onPaid]);

  const handleCashPayment = useCallback(() => {
    const amt = totals.total.toFixed(2);
    setPaidAmount(amt);
    setPaidMethod("Cash");
    setStep("paid");
    onPaid(ro.id, amt, "Cash");
  }, [totals.total, ro.id, onPaid]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: COLORS.bgCard,
          borderRadius: 16,
          width: step === "customerPage" ? 740 : 580,
          maxWidth: "95vw",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          transition: "width 0.3s ease",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "18px 24px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>
              {step === "paid" ? "Checkout Complete" : "Finalize & Checkout"}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>
              {ro.id} &mdash; {customer ? `${customer.firstName} ${customer.lastName}` : "Customer"} &mdash;{" "}
              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: COLORS.textMuted }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {step === "paid" ? (
            <PaidConfirmation amount={paidAmount} method={paidMethod} roId={ro.id} onClose={onClose} />
          ) : step === "customerPage" ? (
            // Two-column: invoice left, phone mockup right
            <div style={{ display: "flex", gap: 0 }}>
              {/* Left: waiting indicator */}
              <div style={{ flex: 1, padding: "24px", borderRight: `1px solid ${COLORS.border}` }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Waiting for payment...</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                    Pay link sent to {phone}. Customer sees this on their phone:
                  </div>
                </div>
                {/* Mini invoice recap */}
                <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>Invoice Summary</div>
                  {ro.services.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary, flex: 1, paddingRight: 8 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: COLORS.textPrimary, fontWeight: 600 }}>${(s.laborCost + s.partsCost).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 8 }}>
                    {discountAmt > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "#16A34A" }}>Discount</span>
                        <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>-${discountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>Shop supplies</span>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>${totals.shopSupplies.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>Tax (9.25%)</span>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>${totals.tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary }}>Total</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary }}>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>
                  This view will update automatically when the customer pays.
                </div>
              </div>

              {/* Right: phone mockup */}
              <div style={{ padding: "24px", display: "flex", alignItems: "flex-start", justifyContent: "center", background: "#F8FAFC" }}>
                <CustomerPayPage ro={ro} vehicle={vehicle} totals={totals} onPay={handleCustomerPaid} />
              </div>
            </div>
          ) : (
            // Main checkout form
            <div style={{ padding: "20px 24px" }}>
              {/* Line items table */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>Invoice Line Items</div>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", background: COLORS.borderLight, borderBottom: `1px solid ${COLORS.border}`, padding: "8px 14px", gap: 8 }}>
                    {["Service", "Labor", "Parts", "Total"].map((h, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: i > 0 ? "right" : "left" }}>{h}</span>
                    ))}
                  </div>
                  {ro.services.map((s, i) => (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
                      padding: "8px 14px", gap: 8,
                      borderBottom: i < ro.services.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                    }}>
                      <span style={{ fontSize: 12, color: COLORS.textPrimary }}>{s.name}</span>
                      <span style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: "right" }}>{s.laborCost > 0 ? `$${s.laborCost.toFixed(2)}` : "—"}</span>
                      <span style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: "right" }}>{s.partsCost > 0 ? `$${s.partsCost.toFixed(2)}` : "—"}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, textAlign: "right" }}>${(s.laborCost + s.partsCost).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals + Discount */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
                {/* Discount */}
                <div style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>Discount</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ display: "flex", border: `1px solid ${COLORS.border}`, borderRadius: 7, overflow: "hidden", height: 34 }}>
                      {["$", "%"].map(t => (
                        <button
                          key={t}
                          onClick={() => setDiscountType(t)}
                          style={{
                            width: 36, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                            background: discountType === t ? COLORS.primary : COLORS.bgCard,
                            color: discountType === t ? "#FFFFFF" : COLORS.textSecondary,
                          }}
                        >{t}</button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      style={{
                        flex: 1, padding: "0 10px", border: `1px solid ${COLORS.border}`, borderRadius: 7,
                        fontSize: 14, color: COLORS.textPrimary, background: COLORS.bgCard, height: 34, outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Totals */}
                <div style={{ flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  {discountAmt > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#16A34A" }}>Discount</span>
                      <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>-${discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>Shop supplies</span>
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>${totals.shopSupplies.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>Tax (9.25%)</span>
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>Total Due</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment method tabs */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>Payment Method</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {[
                    { id: "sendLink", icon: Send, label: "Send Pay Link" },
                    { id: "card", icon: CreditCard, label: "Charge Card" },
                    { id: "cash", icon: Banknote, label: "Cash" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPayMethod(id)}
                      style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        padding: "10px 8px",
                        border: `2px solid ${payMethod === id ? COLORS.primary : COLORS.border}`,
                        borderRadius: 10, cursor: "pointer",
                        background: payMethod === id ? "#E0F0F3" : COLORS.bgCard,
                        color: payMethod === id ? COLORS.primary : COLORS.textSecondary,
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Send Pay Link tab */}
                {payMethod === "sendLink" && (
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
                      Send a secure pay link to the customer's phone. They'll see their invoice and pay with Apple Pay, Google Pay, or card.
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <Phone size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }} />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          style={{
                            width: "100%", padding: "8px 10px 8px 30px", boxSizing: "border-box",
                            border: `1px solid ${COLORS.border}`, borderRadius: 7,
                            fontSize: 13, color: COLORS.textPrimary, background: COLORS.bgCard, outline: "none",
                          }}
                        />
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSecondary, marginBottom: 14, cursor: "pointer" }}>
                      <input type="checkbox" defaultChecked style={{ cursor: "pointer" }} />
                      Also send email to {customer?.email || "customer"}
                    </label>
                    <button
                      onClick={handleSendLink}
                      style={{
                        width: "100%", padding: "12px",
                        background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
                        color: "#FFFFFF", border: "none", borderRadius: 10,
                        fontWeight: 800, fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: "0 4px 14px rgba(255,107,53,0.3)",
                      }}
                    >
                      <Send size={15} />
                      Send Pay Link — ${totals.total.toFixed(2)}
                    </button>
                  </div>
                )}

                {/* Charge Card tab */}
                {payMethod === "card" && (
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
                      Charge the customer's card using the Square Terminal at the counter, or tap-to-pay on this device.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSendLink}
                        style={{
                          flex: 1, padding: "11px 0",
                          background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
                          color: "#FFFFFF", border: "none", borderRadius: 9,
                          fontWeight: 700, fontSize: 13, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        <CreditCard size={14} />
                        Terminal (Counter)
                      </button>
                      <button
                        onClick={handleSendLink}
                        style={{
                          flex: 1, padding: "11px 0",
                          background: COLORS.primary,
                          color: "#FFFFFF", border: "none", borderRadius: 9,
                          fontWeight: 700, fontSize: 13, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        <Phone size={14} />
                        Tap-to-Pay
                      </button>
                    </div>
                  </div>
                )}

                {/* Cash tab */}
                {payMethod === "cash" && (
                  <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
                      Record a cash payment and calculate change.
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Amount Tendered</div>
                        <div style={{ position: "relative" }}>
                          <DollarSign size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }} />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={totals.total.toFixed(2)}
                            value={cashAmount}
                            onChange={e => setCashAmount(e.target.value)}
                            style={{
                              width: "100%", padding: "9px 10px 9px 28px", boxSizing: "border-box",
                              border: `1px solid ${COLORS.border}`, borderRadius: 7,
                              fontSize: 14, color: COLORS.textPrimary, background: COLORS.bgCard, outline: "none",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Change Due</div>
                        <div style={{
                          padding: "9px 12px", border: `1px solid ${change > 0 ? "#86EFAC" : COLORS.border}`,
                          borderRadius: 7, background: change > 0 ? "#F0FDF4" : COLORS.bgCard,
                          fontSize: 14, fontWeight: 700,
                          color: change > 0 ? "#16A34A" : COLORS.textMuted,
                        }}>
                          ${change.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCashPayment}
                      disabled={cashNum < totals.total && cashAmount !== ""}
                      style={{
                        width: "100%", padding: "12px",
                        background: (cashNum >= totals.total || cashAmount === "") ? `linear-gradient(135deg, ${COLORS.accent}, #E85D26)` : "#D1D5DB",
                        color: "#FFFFFF", border: "none", borderRadius: 10,
                        fontWeight: 800, fontSize: 14,
                        cursor: (cashNum >= totals.total || cashAmount === "") ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      <Banknote size={15} />
                      Record Cash — ${totals.total.toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
