# WrenchIQ AI Service Advisor Agent — Product Specification

**Product:** WrenchIQ AI Service Advisor (Add-On)
**Version:** 1.0
**Date:** 2026-03-27
**Owner:** Predii, Inc.
**Classification:** PREDII CONFIDENTIAL

---

## 1. Executive Summary

WrenchIQ AI Service Advisor is a stand-alone intelligence layer that attaches to any existing Shop Management System (SMS). It does not replace the shop's current SMS — it augments it with autonomous AI capabilities: continuous monitoring of repair orders, proactive revenue and operational insights, customer experience intelligence, and a conversational service advisor agent with persistent memory.

The core premise is that most SMS platforms are excellent record-keeping tools but passive — they store data, they do not think. WrenchIQ AI Service Advisor acts as the "thinking layer" on top, watching every RO in real time and surfacing the right action to the right person at the right moment.

**Key differentiator:** Zero SMS replacement friction. Any shop on Mitchell1, Tekmetric, Shop-Ware, R.O. Writer, AutoFluent, or CDK/Reynolds can activate this add-on in under a day.

---

## 2. Product Vision

> "Your best service advisor — available 24/7, never misses a follow-up, and gets smarter every week."

The agent operates autonomously between SMS events. It reads normalized repair order data from the WrenchIQ MongoDB layer, applies AI reasoning across shop-configured rules and historical patterns, and pushes prioritized actions to the service advisor's queue or directly to the customer (where authorized).

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  Existing Shop SMS                           │
│  (Mitchell1 / Tekmetric / Shop-Ware / R.O. Writer / CDK)    │
└──────────────────┬───────────────────────────────────────────┘
                   │  SMS Adapter (read + optional write-back)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│           WrenchIQ Normalization Layer                       │
│  • Parses SMS-native RO format                               │
│  • Maps to Universal WrenchIQ RO Schema                     │
│  • Stores normalized ROs in MongoDB (wrenchiq db)            │
│  • Real-time via webhook or polling (configurable)           │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│        AI Service Advisor Agent (Autonomous)                 │
│                                                              │
│  Memory Layer          Tool Access           Monitoring Loop │
│  ─────────────         ───────────           ─────────────── │
│  • Shop prefs          • RO data             • Every 5 min   │
│  • SMS config          • Customer history    • Event-driven  │
│  • Staff profiles      • Vehicle data        • Daily digest  │
│  • Historical KPIs     • Parts pricing       • Alert queue   │
│  • Rule library        • Recalls / TSBs                      │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              Delivery Channels                               │
│  • WrenchIQ Service Advisor UI (web / mobile)                │
│  • SMS / push notification to advisor                        │
│  • Optional: customer-facing text / email                    │
│  • Optional: write-back to source SMS                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Integration Prerequisites

Before the AI Service Advisor Agent can begin adding value, the following integration gates must be satisfied. These are organized into four phases — the agent activates incrementally as each phase is completed.

### Phase 0 — Identity & Configuration (Day 0, Required)

These are the minimum required before any agent functionality is enabled.

| Requirement | Description | Source |
|-------------|-------------|--------|
| Shop profile | Name, address, timezone, labor rate, bay count, brand flags | Manual onboarding form |
| SMS platform identifier | Which SMS is being connected (e.g., `tekmetric`, `mitchell1`) | Manual selection |
| Operator credentials | API key or OAuth token for the SMS platform | SMS admin panel |
| MongoDB connection | WrenchIQ MongoDB URI with write access to `wrenchiq` database | Predii provisioned |
| Staff roster | Advisor names, roles, and contact info (for alert routing) | SMS import or manual |
| Notification preferences | How/when to alert advisors (SMS, push, email, in-app) | Onboarding wizard |

### Phase 1 — Repair Order Read Access (Day 1, Core Value)

Enables: RO monitoring, revenue insights, bay status, completion tracking.

| Requirement | Description | Minimum Data Fields |
|-------------|-------------|---------------------|
| Active RO stream | Real-time or near-real-time access to open ROs | RO number, status, vehicle, customer, line items, labor, parts, totals, advisor assigned, open date, promised time |
| RO status transitions | Events when RO moves: created → in progress → waiting parts → complete → invoiced | Status + timestamp |
| Line item details | Individual labor ops, parts, sublet, fees with status (approved / declined / pending) | Op code, description, qty, price, status |
| Customer contact | Name, phone, email linked to each RO | Name, primary phone, email |
| Technician assignment | Which tech is on each RO or labor line | Tech ID, name |

### Phase 2 — Vehicle & History Access (Day 3–7, Intelligence Amplifier)

Enables: predictive maintenance flags, TSB matching, recall detection, deferred service escalation.

| Requirement | Description | Minimum Data Fields |
|-------------|-------------|---------------------|
| Vehicle profile | Year, make, model, trim, engine, VIN for each vehicle | All YMME fields + VIN |
| RO history | Prior visits and services for the vehicle | Past RO summaries, service dates, mileage at service |
| Declined services | Previously declined line items with dates | Op code, description, decline date, decline reason if captured |
| Current mileage | Odometer at current visit | Odometer reading |
| Customer vehicle list | All vehicles tied to a customer | Vehicle IDs linked to customer |

### Phase 3 — Financial & Scheduling Access (Day 7–14, Operational Intelligence)

Enables: revenue pipeline, collection alerts, scheduling optimization, parts delay detection.

| Requirement | Description | Minimum Data Fields |
|-------------|-------------|---------------------|
| Invoice / payment status | Whether an RO has been paid, payment method, balance due | Invoice date, amount, payment method, balance |
| Appointment schedule | Upcoming appointments with vehicle and service type | Appointment date/time, vehicle, stated concern |
| Parts orders | Parts ordered for each RO, ETA, received status | Part number, vendor, order date, ETA, received flag |
| Warranty claims | Open warranty ROs or claim submissions | Claim type, status, authorization number |

### Phase 4 — Write-Back Capability (Optional, Advanced)

Enables: agent-initiated customer communications, status updates pushed back to SMS, appointment creation.

| Requirement | Description | Risk Level |
|-------------|-------------|------------|
| SMS RO status update API | Agent can push status changes back to source SMS | Medium — requires SMS support |
| Appointment creation API | Agent can book follow-up appointments | Medium |
| Customer communication API | Agent can trigger texts/emails via SMS or third-party (Twilio, Podium) | Low — separate from SMS |
| Declined service re-quote | Agent can create a new RO or estimate for declined items | Medium |

---

## 5. Universal WrenchIQ Normalized RO Schema

All SMS adapters convert their native format into this schema before writing to MongoDB. The agent only reads from this normalized layer — it never reads the source SMS format directly.

```json
{
  "ro_id": "string (WrenchIQ internal UUID)",
  "source_sms": "string (tekmetric | mitchell1 | shopware | rowriter | autofluent | cdk | rr | other)",
  "source_ro_number": "string (native RO number in the SMS)",
  "shop_id": "string",
  "advisor_id": "string",
  "tech_ids": ["string"],

  "status": "string (open | in_progress | waiting_parts | waiting_customer | complete | invoiced | void)",
  "promised_time": "ISO8601 datetime",
  "opened_at": "ISO8601 datetime",
  "closed_at": "ISO8601 datetime | null",

  "customer": {
    "id": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "loyalty_tier": "string | null",
    "visit_count": "number",
    "last_visit_date": "ISO8601 date | null"
  },

  "vehicle": {
    "id": "string",
    "vin": "string",
    "year": "number",
    "make": "string",
    "model": "string",
    "trim": "string | null",
    "engine": "string | null",
    "odometer": "number",
    "color": "string | null",
    "plate": "string | null"
  },

  "stated_concern": "string",

  "line_items": [
    {
      "line_id": "string",
      "type": "string (labor | part | sublet | fee | fluid | tire)",
      "op_code": "string | null",
      "description": "string",
      "status": "string (approved | declined | pending | recommended)",
      "quantity": "number",
      "unit_price": "number",
      "extended_price": "number",
      "tech_id": "string | null",
      "estimated_hours": "number | null",
      "actual_hours": "number | null",
      "part_number": "string | null",
      "vendor": "string | null",
      "part_received": "boolean | null",
      "part_eta": "ISO8601 datetime | null"
    }
  ],

  "totals": {
    "labor": "number",
    "parts": "number",
    "sublet": "number",
    "fees": "number",
    "tax": "number",
    "discount": "number",
    "total": "number",
    "balance_due": "number"
  },

  "payment": {
    "status": "string (unpaid | partial | paid)",
    "method": "string | null",
    "paid_at": "ISO8601 datetime | null"
  },

  "flags": {
    "has_recall": "boolean",
    "has_open_tsb": "boolean",
    "has_declined_services": "boolean",
    "is_first_visit": "boolean",
    "is_fleet": "boolean",
    "is_warranty": "boolean"
  },

  "ai_metadata": {
    "insights_generated_at": "ISO8601 datetime | null",
    "active_insights": ["string (insight IDs)"],
    "sentiment_score": "number | null (0–1)",
    "upsell_probability": "number | null (0–1)",
    "churn_risk": "number | null (0–1)",
    "estimated_lifetime_value": "number | null"
  },

  "sync_metadata": {
    "last_synced_at": "ISO8601 datetime",
    "sync_version": "number",
    "adapter_version": "string"
  }
}
```

---

## 6. AI Service Advisor Agent — Capabilities

### 6.1 Agent Memory Architecture

The agent maintains three tiers of memory, all stored in MongoDB:

| Memory Tier | Scope | Contents | TTL |
|-------------|-------|----------|-----|
| **Shop Memory** | Persistent | Labor rate, bay count, brands, staff roster, service menu, common op codes, vendor preferences, communication preferences, escalation rules | Permanent |
| **Pattern Memory** | Rolling 12 months | Historical RO averages, common decline reasons, seasonal trends, top upsells that converted, customer re-visit rates by service type | 12 months rolling |
| **Session Memory** | Per-RO lifecycle | Current RO state, conversation history with advisor/customer, pending actions, last insight delivered | RO lifetime + 30 days |

### 6.2 Agent Tool Access

| Tool | Description | Phase Required |
|------|-------------|----------------|
| `get_active_ros` | Fetch all open ROs for the shop | Phase 1 |
| `get_ro_detail` | Fetch full normalized RO by ID | Phase 1 |
| `get_customer_history` | Fetch all ROs for a customer/vehicle | Phase 2 |
| `get_declined_services` | Fetch unresolved declined services for a vehicle | Phase 2 |
| `lookup_recall` | Query NHTSA recall API by VIN | Phase 2 |
| `lookup_tsb` | Query ALLDATA/Mitchell1 TSB by YMME + symptom | Phase 2 |
| `get_parts_status` | Check parts ETA for an RO | Phase 3 |
| `get_appointment_queue` | Fetch upcoming scheduled appointments | Phase 3 |
| `get_revenue_pipeline` | Aggregate declined services $ by advisor/period | Phase 3 |
| `send_advisor_alert` | Push a prioritized insight to the advisor | Phase 1 |
| `send_customer_message` | Send authorized text/email to customer | Phase 4 |
| `update_ro_status` | Write status back to source SMS | Phase 4 |
| `create_appointment` | Book a follow-up in the SMS | Phase 4 |

---

## 7. AI Insights Catalog — Ongoing Monitoring

This is the complete catalog of insights the agent monitors. Each insight has a trigger condition, priority level, and default delivery target.

### Category A — Revenue Recovery (Highest ROI)

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `REV-001` | Declined Service Follow-Up | Customer has declined services from last visit; vehicle back in shop OR 30/60/90 days elapsed | P1 | Advisor |
| `REV-002` | Approval Pending Too Long | A recommended service line has been in `pending` status > 2 hours with customer unreachable | P1 | Advisor |
| `REV-003` | High-Value Upsell Opportunity | Vehicle mileage triggers manufacturer-recommended service not yet on the RO (timing belt, transmission service, coolant flush) | P2 | Advisor |
| `REV-004` | Deferred Service Escalation | A service declined 90+ days ago is now overdue per manufacturer interval | P1 | Advisor |
| `REV-005` | Fleet Revenue Concentration Risk | >30% of month's revenue from a single fleet account; flag for diversification conversation | P3 | Owner |
| `REV-006` | Below-Average RO Value | Active RO total is >25% below shop average for the same service category | P2 | Advisor |
| `REV-007` | Quick-Win Add-On Detected | Vehicle is due for wiper blades, cabin filter, or air filter — high-margin, fast-approval items | P2 | Advisor |

### Category B — Customer Experience

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `CX-001` | Customer Not Updated | No outbound contact logged in > 3 hours on an open RO | P1 | Advisor |
| `CX-002` | Vehicle Ready, Not Picked Up | RO marked complete but customer has not arrived in > 2 hours | P1 | Advisor |
| `CX-003` | Promise Time At Risk | Estimated completion time will exceed promised time based on current labor progress | P1 | Advisor |
| `CX-004` | First-Time Customer Detected | Customer has 0 prior visits — flag for high-touch onboarding experience | P2 | Advisor |
| `CX-005` | Returning Customer After Lapse | Customer has not visited in > 12 months — flag for re-engagement | P2 | Advisor |
| `CX-006` | Negative Sentiment Signal | Customer message or note contains frustration language (agent NLP analysis) | P1 | Advisor + Owner |
| `CX-007` | Approval Obtained, Tech Not Notified | Customer approved a service but tech has no updated assignment | P1 | Advisor |
| `CX-008` | Multi-Vehicle Household Opportunity | Customer has another vehicle in the household with overdue services | P3 | Advisor |

### Category C — Operational Intelligence

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `OPS-001` | Bay Bottleneck Detected | >2 ROs waiting for same tech; parallel reallocation possible | P2 | Advisor |
| `OPS-002` | Parts Delay Will Miss Promise | Ordered part ETA exceeds RO promised time | P1 | Advisor |
| `OPS-003` | Parts Not Ordered Yet | Approved parts line item has no associated PO after 30 minutes | P1 | Advisor |
| `OPS-004` | Tech Idle With Open ROs Waiting | A tech has no active assignment but there are open, approved ROs | P2 | Advisor |
| `OPS-005` | Labor Hours Creep | Actual hours on an op have exceeded estimated by > 50% | P2 | Advisor |
| `OPS-006` | Sublet Overdue | Sublet job was sent out > promised turnaround time ago with no return confirmation | P1 | Advisor |
| `OPS-007` | High Bay Load Approaching | Shop is at >85% bay capacity for tomorrow's appointments | P2 | Owner |
| `OPS-008` | Same-Day Capacity Opening | A cancellation or fast job completion has created an open bay slot | P3 | Advisor |

### Category D — Vehicle Intelligence

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `VEH-001` | Open Safety Recall Detected | VIN match to active NHTSA recall not yet addressed | P1 | Advisor (required disclosure) |
| `VEH-002` | TSB Match to Stated Concern | ALLDATA/Mitchell1 TSB matches the customer's stated complaint for this YMME | P2 | Advisor + Tech |
| `VEH-003` | Inspection Flag Unresolved | Prior DVI flagged a safety item (red) that has not been addressed in 2+ visits | P1 | Advisor |
| `VEH-004` | Seasonal Risk Flag | Region + season + vehicle type match a predictive failure pattern (e.g., battery in cold weather, AC in summer) | P2 | Advisor |
| `VEH-005` | High-Mileage Threshold Reached | Vehicle crosses a major mileage milestone (30K / 60K / 90K / 100K) | P2 | Advisor |
| `VEH-006` | Maintenance Plan Deviation | Vehicle has skipped a scheduled maintenance interval based on manufacturer guide | P2 | Advisor |

### Category E — Financial & Compliance

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `FIN-001` | Same-Day Collection Opportunity | RO completed and invoiced but no payment collected; customer still on-site | P1 | Advisor |
| `FIN-002` | High Balance Due on Departure | Customer leaving with balance > $500 without payment arrangement | P1 | Advisor |
| `FIN-003` | Warranty Claim Eligibility | RO type and vehicle qualify for OEM/extended warranty coverage not yet filed | P2 | Advisor |
| `FIN-004` | Coupon/Promotion Not Applied | Shop has active promo matching services on this RO; not applied | P2 | Advisor |
| `FIN-005` | Labor Recovery Below Threshold | Tech efficiency for this RO < 70% — flag for coaching conversation | P3 | Owner |
| `FIN-006` | Missing Authorization Signature | RO total exceeds state-required written auth threshold; no signed authorization recorded | P1 | Advisor (compliance) |
| `FIN-007` | Cash RO Above Reporting Threshold | Cash payment > $10,000 on a single RO — flag for IRS Form 8300 compliance | P1 | Owner |

### Category F — Daily Digest (Owner / Manager)

Delivered once per day (configurable: morning briefing or end-of-day summary):

| Insight ID | Name | Contents |
|------------|------|---------|
| `DIG-001` | Morning Shop Brief | Appointments today, bay availability, parts arriving, staff on duty, open ROs from prior day |
| `DIG-002` | Revenue Pipeline | Total value of all declined services in last 30/60/90 days, segmented by category |
| `DIG-003` | Tech Efficiency Scorecard | Actual vs. estimated hours by tech for the week |
| `DIG-004` | Customer Experience Score | Count of CX alerts triggered, response times, promise-time miss rate |
| `DIG-005` | Top Opportunities This Week | 5 highest-value follow-up opportunities with customer name, vehicle, declined service, value |

---

## 8. SMS Adapter Specifications

### Supported SMS Platforms (v1.0)

| Platform | Integration Method | Sync Mode | Write-Back |
|----------|-------------------|-----------|------------|
| Tekmetric | REST API (OAuth2) | Real-time webhook + polling fallback | Yes (v2) |
| Shop-Ware | REST API (API key) | Real-time webhook | Yes (v2) |
| Mitchell1 | REST API + SOAP legacy | Polling (5 min) | Partial |
| R.O. Writer | REST API (API key) | Polling (5 min) | Planned |
| AutoFluent | REST API | Polling (10 min) | Planned |
| CDK Drive | REST API (OAuth2) | Real-time event stream | Yes (v2) |
| Reynolds & Reynolds | ERA-IGNITE API | Polling (15 min) | Planned |
| Generic CSV/FTP | Flat file export | Batch (hourly) | No |

### Adapter Interface Contract

Each SMS adapter must implement this interface:

```typescript
interface SMSAdapter {
  // Return all ROs modified since the given timestamp
  fetchUpdatedROs(since: Date): Promise<NativeRO[]>;

  // Convert native RO to WrenchIQ normalized schema
  normalizeRO(native: NativeRO): WrenchIQNormalizedRO;

  // Optional: push status update back to SMS
  updateROStatus?(roId: string, status: string): Promise<void>;

  // Optional: send customer message via SMS platform
  sendCustomerMessage?(customerId: string, message: string): Promise<void>;

  // Health check
  ping(): Promise<{ connected: boolean; latencyMs: number }>;
}
```

---

## 9. Agent Configuration Schema

Stored in MongoDB `shop_config` collection per shop:

```json
{
  "shop_id": "string",
  "sms_platform": "string",
  "sms_credentials": { "encrypted": true },
  "labor_rate": "number",
  "bay_count": "number",
  "timezone": "string (IANA)",
  "business_hours": {
    "monday": { "open": "08:00", "close": "18:00" },
    "...": "..."
  },
  "advisor_alert_preferences": {
    "channel": "string (in_app | sms | email | push)",
    "quiet_hours": { "start": "18:00", "end": "08:00" },
    "min_priority": "string (P1 | P2 | P3)"
  },
  "enabled_insights": ["REV-001", "REV-002", "..."],
  "disabled_insights": [],
  "custom_thresholds": {
    "customer_update_interval_hours": 3,
    "vehicle_ready_pickup_alert_hours": 2,
    "declined_service_followup_days": [30, 60, 90]
  },
  "write_back_enabled": false,
  "customer_messaging_enabled": false,
  "digest_delivery_time": "07:30",
  "digest_recipients": ["owner@shop.com"]
}
```

---

## 10. Onboarding Flow (Time to First Insight)

```
Hour 0    Shop selects SMS platform + enters API credentials
          Agent runs connectivity health check
          Shop profile filled (labor rate, bay count, timezone, staff)

Hour 1    First RO sync completes
          Normalization layer populates MongoDB
          Agent activates Phase 1 insights (REV, CX, OPS categories)
          First advisor alert delivered

Day 3     Vehicle history sync complete (if SMS supports it)
          VEH insights activated (recall detection, TSB matching)
          Declined service pipeline populated

Day 7     Financial data connected
          FIN insights activated
          Daily digest begins

Day 30    Pattern memory populated with 30 days of shop behavior
          AI thresholds auto-calibrated to shop's own baseline
          Upsell probability and churn risk scoring activated
```

---

## 11. Security & Data Governance

| Requirement | Implementation |
|-------------|----------------|
| Credential storage | AES-256 encrypted at rest in MongoDB; never logged |
| Data isolation | Each shop's data is namespaced by `shop_id`; no cross-shop data access |
| PII handling | Customer PII encrypted at field level; masked in logs |
| SMS token rotation | OAuth tokens refreshed automatically; API keys rotated on schedule |
| Audit trail | Every agent action logged with timestamp, insight ID, and delivery confirmation |
| Data retention | Normalized ROs retained 3 years; raw sync payloads retained 30 days |
| GDPR/CCPA | Customer data deletion request triggers purge across normalized layer |

---

## 12. Success Metrics

| Metric | Target (90-day post-activation) |
|--------|--------------------------------|
| Declined service recovery rate | >15% of flagged declined services converted |
| Promise time accuracy | >90% of ROs completed within promised window |
| Customer update compliance | <5% of ROs trigger CX-001 (no update in 3 hrs) |
| Recall disclosure rate | 100% of VIN-matched recalls disclosed on visit |
| Advisor response to P1 alerts | >80% acknowledged within 15 minutes |
| Daily digest open rate | >70% of digest recipients opening within 2 hours |
| Time to first insight | < 1 hour from SMS credentials entered |

---

## 13. Future Roadmap (v2+)

| Feature | Description | Phase |
|---------|-------------|-------|
| Voice agent | Inbound customer calls handled by AI service advisor | v2 |
| Technician co-pilot | Agent pushes TSBs and repair guidance to tech mobile | v2 |
| Multi-location aggregation | Insights rolled up across shop group | v2 |
| Predictive scheduling | Agent proposes optimal appointment slots based on bay load + job mix | v2 |
| Customer-facing agent | Autonomous customer portal with RO status, approvals, and messaging | v2 |
| OEM integration | Connect to OEM warranty and recall systems directly | v3 |
| Insurance integration | Detect and initiate insurance claims for qualifying repairs | v3 |
