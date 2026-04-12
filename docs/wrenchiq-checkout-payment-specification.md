# WrenchIQ Checkout & Payment Processing Specification

**Version:** 1.0
**Date:** 2026-03-27
**Edition:** WrenchIQ-AM (Aftermarket)
**Status:** Draft
**Author:** Predii Product

---

## 1. Overview

This specification defines the checkout and payment processing flow for WrenchIQ. When a repair order reaches completion, the advisor generates a final invoice, the customer receives a payment link or in-shop prompt, and the transaction posts to Xero as a general ledger entry.

**Payment processor:** Square
**General ledger:** Xero
**Customer entry point:** SMS/email payment link — one tap to pay

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Frictionless customer pay | Customer taps one link and pays — no app install, no account required |
| In-shop payment | Counter terminal and tap-to-pay on advisor's tablet/phone via Square |
| Accurate GL posting | Every transaction auto-posts to Xero with correct chart-of-accounts coding |
| Split tender | Support cash + card, multiple cards, financing (DigniFi/Sunbit) |
| Audit trail | Full payment history on every RO, queryable by advisor and owner |

---

## 3. User Flows

### 3.1 Advisor-Initiated Checkout (Primary Flow)

```
RO Status → "Work Complete"
    │
    ▼
Advisor clicks [Finalize & Checkout] on RO card
    │
    ▼
Checkout Screen loads with:
  - Line items (labor, parts, sublet, fees, taxes)
  - Totals (subtotal, tax, discount, amount due)
  - Payment method selector
    │
    ├── [Send Pay Link] → SMS/email sent to customer → Customer pays on phone
    ├── [Charge Card] → Square Terminal PIN pad or tap-to-pay
    ├── [Cash]        → Record cash amount, calculate change
    └── [Financing]   → DigniFi / Sunbit redirect
    │
    ▼
Payment captured by Square
    │
    ▼
Receipt generated (PDF + SMS/email)
    │
    ▼
RO status → "Closed / Paid"
    │
    ▼
Xero invoice created + payment posted → GL updated
```

### 3.2 Customer Self-Pay (SMS/Email Link)

```
Customer receives: "Your [Vehicle] is ready. Total: $487.50 — Pay here: [link]"
    │
    ▼
Customer opens link in mobile browser (no app required)
    │
    ▼
Customer Pay Page shows:
  - Shop name + logo
  - Vehicle: 2019 Honda Accord
  - Services summary (collapsed by default, expandable)
  - Amount due: $487.50
  - [Pay Now] button (prominent, full-width, orange)
    │
    ▼
Square Web Payments SDK collects card (or Apple Pay / Google Pay)
    │
    ▼
Payment authorized → confirmation screen + receipt emailed/texted
    │
    ▼
Advisor notified in-app (toast + RO badge updates)
    │
    ▼
Xero invoice auto-posted
```

---

## 4. Customer Pay Page

The customer pay page is a minimal, branded, mobile-first page. It must work on any phone browser with no login.

### 4.1 Layout

```
┌─────────────────────────────┐
│  [WrenchIQ Logo]  Peninsula │
│      Precision Auto         │
├─────────────────────────────┤
│  2019 Honda Accord          │
│  VIN: 1HGCV1F34KA…         │
├─────────────────────────────┤
│  ▼ Services (tap to expand) │
│    Oil & Filter Change      │
│    Brake Inspection         │
│    Tire Rotation            │
├─────────────────────────────┤
│  Subtotal       $420.00     │
│  Tax (9.25%)     $38.85     │
│  Shop Supply      $28.65    │
│  ─────────────────────────  │
│  Total Due      $487.50     │
├─────────────────────────────┤
│                             │
│      [ Pay $487.50 ]        │  ← Square Web Payments / Apple Pay
│                             │
│  Secure payment by Square   │
└─────────────────────────────┘
```

### 4.2 Behavior

- Page is accessible via a signed, time-limited token URL (expires 72 hours after generation)
- If already paid, page shows "Payment received — thank you" with receipt download link
- Apple Pay and Google Pay shown automatically when available on device
- On success: full-screen confirmation with animated checkmark, receipt sent
- No account creation or login required at any point

---

## 5. Square Integration

### 5.1 Payment Methods Supported

| Method | How | Notes |
|--------|-----|-------|
| Card (swipe/chip/tap) | Square Terminal | Counter terminal, wired or Bluetooth |
| Tap-to-pay | Square Reader SDK on iOS/Android | Advisor's phone becomes terminal |
| Apple Pay / Google Pay | Square Web Payments SDK | Auto-detected on customer pay page |
| Card on file | Square Customers API | Returning customers can authorize reuse |
| Manual card entry | Square Web Payments SDK | Customer types card number on pay page |
| Cash | WrenchIQ (no Square) | Recorded locally; change calculated |

### 5.2 Square APIs Used

| API | Purpose |
|-----|---------|
| Square Payments API | Create payment, retrieve payment |
| Square Web Payments SDK | Browser-based card collection on customer pay page |
| Square Terminal API | Push payment request to in-shop hardware terminal |
| Square Reader SDK | Tap-to-pay on iOS/Android advisor device |
| Square Orders API | Create order with line items for itemized receipts |
| Square Customers API | Create/lookup customer for card-on-file |
| Square Refunds API | Issue full or partial refund |
| Square Webhooks | `payment.completed`, `payment.updated`, `refund.created` |

### 5.3 Payment Request Object

```json
{
  "idempotency_key": "ro-{ro_id}-attempt-{attempt_number}",
  "amount_money": {
    "amount": 48750,
    "currency": "USD"
  },
  "source_id": "{square_nonce_or_token}",
  "order_id": "{square_order_id}",
  "customer_id": "{square_customer_id}",
  "note": "RO-2847 — Peninsula Precision Auto",
  "reference_id": "ro-2847",
  "app_fee_money": null
}
```

### 5.4 Split Tender

When a customer pays with multiple methods (e.g., $200 cash + $287.50 card):

1. Cash amount recorded first (no Square call)
2. Remaining balance sent to Square as a normal payment
3. Both entries shown on receipt and posted to Xero

### 5.5 Refunds

- Partial and full refunds initiated from RO history view
- Square Refunds API called with `payment_id` and `amount_money`
- Xero credit note created automatically on refund
- Customer notified via SMS/email

---

## 6. Xero Integration

### 6.1 Chart of Accounts Mapping

| Line Item Type | Xero Account | Account Code |
|---------------|--------------|--------------|
| Labor | Automotive Repair — Labor | 4000 |
| Parts | Automotive Repair — Parts | 4010 |
| Sublet | Sublet Repairs | 4020 |
| Shop Supplies | Shop Supply Fee | 4030 |
| Hazardous Waste | Environmental Fee | 4040 |
| Sales Tax | Sales Tax Payable | 2200 |
| Discount | Sales Discount | 4090 |
| Financing Fee | Financing Expense | 6100 |

> Account codes are configurable per shop in Settings → Accounting.

### 6.2 Xero Invoice Lifecycle

| WrenchIQ Event | Xero Action |
|---------------|-------------|
| RO created | Draft invoice created in Xero |
| Customer approves estimate | Invoice status → `SUBMITTED` |
| Work complete, checkout opened | Invoice status → `AUTHORISED` (awaiting payment) |
| Payment captured | Payment posted to invoice → status → `PAID` |
| Partial payment | Payment posted; invoice remains `AUTHORISED` for remainder |
| Refund issued | Credit note created and applied to original invoice |
| RO voided | Invoice voided in Xero |

### 6.3 Xero APIs Used

| API | Purpose |
|-----|---------|
| Xero Accounting API — Invoices | Create, update, retrieve invoices |
| Xero Accounting API — Payments | Post payment against an invoice |
| Xero Accounting API — CreditNotes | Issue credit note for refunds |
| Xero Accounting API — Contacts | Create/lookup customer as Xero contact |
| Xero Accounting API — Accounts | Validate chart of accounts on setup |
| Xero OAuth 2.0 | Authentication and token refresh |

### 6.4 Xero Invoice Object

```json
{
  "Type": "ACCREC",
  "Contact": {
    "ContactID": "{xero_contact_id}"
  },
  "Reference": "RO-2847",
  "LineAmountTypes": "EXCLUSIVE",
  "LineItems": [
    {
      "Description": "Oil & Filter Change — Full Synthetic 0W-20",
      "Quantity": 1.0,
      "UnitAmount": 89.95,
      "AccountCode": "4000",
      "TaxType": "OUTPUT"
    },
    {
      "Description": "Mobil 1 Full Synthetic 0W-20 (6 qt)",
      "Quantity": 6,
      "UnitAmount": 14.50,
      "AccountCode": "4010",
      "TaxType": "OUTPUT"
    }
  ],
  "DueDate": "2026-03-27",
  "Status": "AUTHORISED"
}
```

### 6.5 Sync Timing

- Invoice created/updated in Xero within 5 seconds of RO status change
- Payment posted to Xero within 10 seconds of Square webhook `payment.completed`
- Failed sync retried up to 3 times with exponential backoff
- Sync errors surface in Settings → Accounting → Sync Log

---

## 7. Data Model

### 7.1 `payments` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `ro_id` | UUID | FK to repair_orders |
| `square_payment_id` | string | Square payment reference |
| `square_order_id` | string | Square order reference |
| `xero_invoice_id` | string | Xero invoice UUID |
| `xero_payment_id` | string | Xero payment UUID |
| `amount_cents` | integer | Amount in cents |
| `method` | enum | `card`, `cash`, `apple_pay`, `google_pay`, `financing` |
| `status` | enum | `pending`, `authorized`, `captured`, `failed`, `refunded` |
| `customer_id` | UUID | FK to customers |
| `idempotency_key` | string | Square idempotency key |
| `pay_link_token` | string | Signed token for customer pay page |
| `pay_link_expires_at` | timestamp | Token expiry (72h from generation) |
| `captured_at` | timestamp | When payment was captured |
| `created_at` | timestamp | Record creation |
| `updated_at` | timestamp | Last update |

### 7.2 `refunds` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `payment_id` | UUID | FK to payments |
| `square_refund_id` | string | Square refund reference |
| `xero_credit_note_id` | string | Xero credit note UUID |
| `amount_cents` | integer | Refund amount in cents |
| `reason` | string | Reason for refund |
| `initiated_by` | UUID | FK to users (advisor) |
| `created_at` | timestamp | Record creation |

---

## 8. UI Components

### 8.1 Checkout Screen (Advisor View)

**Route:** `/checkout/:ro_id`
**Trigger:** "Finalize & Checkout" button on completed RO

**Sections:**
1. **Invoice summary** — line items table with labor, parts, fees, tax, total
2. **Discount field** — dollar or percent, applies to subtotal
3. **Payment method tabs** — Send Link | Charge Card | Cash | Financing
4. **Action bar** — [Send Pay Link] or [Charge $XXX.XX] CTA

**Send Link tab:**
- Phone number pre-filled from customer record (editable)
- "Also send email" checkbox
- [Send Pay Link] button → link sent, screen shows "Waiting for payment..." with live status

**Charge Card tab:**
- Dropdown: "Terminal (Counter)" or "Tap-to-Pay (This Device)"
- [Charge $XXX.XX] button → initiates Square Terminal or Reader SDK

**Cash tab:**
- "Amount tendered" input
- Auto-calculates change due
- [Record Cash Payment] button

### 8.2 Customer Pay Page

**Route:** `/pay/:token` (public, no auth)
**Stack:** Standalone React page, minimal bundle, Square Web Payments SDK

**Components:**
- `ShopHeader` — logo, shop name, address
- `VehicleCard` — year/make/model, VIN last 6
- `ServiceSummary` — collapsible line item list
- `TotalCard` — subtotal, tax, fees, total due
- `SquarePaymentForm` — card fields or Apple/Google Pay button
- `ConfirmationScreen` — success state with receipt CTA

### 8.3 RO History — Payment Badge

On every closed RO card and RO detail view:

```
  ● PAID  $487.50  Visa ••4242  Mar 27, 2026 2:14 PM
```

Clicking opens payment detail drawer with Square receipt link and Xero invoice link.

### 8.4 Refund Dialog

Accessed from payment detail drawer:

- "Full refund" or "Partial refund" toggle
- Amount input (partial only)
- Reason selector: `Customer request`, `Work quality`, `Billing error`, `Other`
- [Issue Refund] button with confirmation step

---

## 9. Notifications

| Trigger | Channel | Recipient | Content |
|---------|---------|-----------|---------|
| Pay link sent | SMS + email | Customer | "Your [vehicle] is ready. Pay here: [link]" |
| Payment received | In-app toast | Advisor | "[Customer] paid $487.50 — RO-2847 closed" |
| Payment received | SMS | Customer | "Payment received — receipt: [link]" |
| Payment failed | In-app | Advisor | "Payment failed for RO-2847 — [reason]" |
| Refund issued | SMS + email | Customer | "Refund of $XX.XX issued — [details]" |
| Xero sync error | In-app | Owner | "Xero sync failed for RO-2847 — check Accounting" |

---

## 10. Settings & Configuration

### 10.1 Square Setup (Settings → Payments)

- Connect Square account via OAuth
- Select Square Location (for multi-location shops)
- Pair Square Terminal devices (list by device ID)
- Enable/disable tap-to-pay on advisor mobile
- Configure default tip prompt (off by default)

### 10.2 Xero Setup (Settings → Accounting)

- Connect Xero organization via OAuth 2.0
- Map WrenchIQ line item types to Xero account codes
- Set default tax rate
- Enable/disable draft invoice creation on RO open
- View sync log (last 30 days of sync events)

### 10.3 Pay Link Settings

- Customizable SMS message template
- Pay link expiry duration (default: 72 hours)
- Shop logo shown on customer pay page
- Enable/disable Apple Pay / Google Pay
- Enable/disable "Request a review" prompt post-payment

---

## 11. Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| PCI-DSS | WrenchIQ never handles raw card numbers — Square SDK tokenizes in-browser |
| Pay link security | HMAC-signed JWT token; single-use on capture; expires 72h |
| Square credentials | Stored encrypted (AES-256) in secrets manager; never in client bundle |
| Xero credentials | OAuth 2.0 with refresh token rotation; stored in secrets manager |
| Refund authorization | Requires `advisor` role minimum; full refunds >$500 require `owner` role |
| Audit log | All payment and refund events appended to immutable audit log |
| HTTPS | All pay page and API traffic TLS 1.2+ enforced |

---

## 12. Error Handling

| Error | User-Facing Message | Recovery |
|-------|--------------------|---------|
| Square payment declined | "Card declined — please try another card" | Customer retries; advisor can switch methods |
| Square timeout | "Payment timed out — please try again" | Idempotency key prevents duplicate charge |
| Pay link expired | "This payment link has expired — please contact the shop" | Advisor generates new link |
| Xero sync failure | Shown in Accounting sync log | Manual re-sync button; auto-retry |
| Square terminal offline | "Terminal offline — use tap-to-pay or send link" | Fallback options offered |

---

## 13. Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| P1 | Customer pay page (Square Web Payments, pay link via SMS) | Planned |
| P2 | Checkout screen with Send Link + Cash flows | Planned |
| P3 | Square Terminal integration (in-shop card payment) | Planned |
| P4 | Xero GL sync (invoice lifecycle + payment posting) | Planned |
| P5 | Tap-to-pay via Square Reader SDK | Planned |
| P6 | Financing (DigniFi / Sunbit) | Planned |
| P7 | Refunds (Square + Xero credit note) | Planned |

---

## 14. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Should WrenchIQ collect tips? If so, at what percentage options? | TK | — |
| 2 | Multi-location: one Square account with multiple locations, or one account per shop? | TK | — |
| 3 | Should cash payments also generate a Xero invoice, or only card? | TK | — |
| 4 | Pay link: should we support partial payment (e.g., deposit)? | TK | — |
| 5 | Financing flow: deep-link to DigniFi/Sunbit or embed their iframe? | TK | — |
