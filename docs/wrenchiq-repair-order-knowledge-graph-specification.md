# WrenchIQ.ai — Repair Order Knowledge Graph Specification

**Version:** 1.0
**Date:** 2026-03-28
**Author:** Predii, Inc.
**Status:** Draft
**Confluence:** NextGen Project Hub > Repair Order Knowledge Graph

---

## 1. Overview

The Repair Order Knowledge Graph (RO-KG) is the semantic core of WrenchIQ.ai's AI-native capabilities. It models every entity, relationship, and event that surrounds a repair order — from the initial customer concern through parts procurement, technician labor, and post-service follow-up. The graph serves as the contextual substrate for all AI inference, LLM interactions, predictive analytics, and shop intelligence.

Legacy Shop Management Systems (SMS) store repair order data in flat relational tables. The RO-KG transforms that flat data into a rich, interconnected graph that enables:

- Contextual AI recommendations at every workflow step
- Technician expertise profiling
- Customer lifetime value modeling
- Parts pricing intelligence and rebate/spiff tracking
- Predictive maintenance scheduling
- Cross-vehicle and cross-shop aggregate insights

---

## 2. Design Principles

1. **Graph-first:** Every entity is a node; every relationship is a typed, directional edge with metadata.
2. **PCdb-normalized parts:** All parts resolve to `PartTerminologyName` (PTN) from the Auto Care Association PCdb standard.
3. **Edition-agnostic:** The graph schema is shared between WrenchIQ-AM (aftermarket) and WrenchIQ-OEM (dealership); the `edition` field on the RO node distinguishes them.
4. **Event-sourced:** Every mutation to the graph appends an event — nothing is overwritten, enabling full auditability and temporal queries.
5. **LLM-ready:** Every node carries a `summary` text field suitable for embedding and RAG retrieval.
6. **Privacy-safe:** Customer PII is stored in a separate secure store; the graph references customer IDs only.

---

## 3. Entity Taxonomy

### 3.1 Core Entities (Nodes)

| Entity | ID Prefix | Description |
|--------|-----------|-------------|
| `RepairOrder` | `RO-` | The central document. One per shop visit. |
| `CustomerConcern` | `CC-` | A symptom or request that initiates a repair job. |
| `RepairJob` | `RJ-` | A single complaint→cause→correction unit within an RO. |
| `LaborOperation` | `LO-` | A billable labor line: description, flat-rate hours, technician hours. |
| `Part` | `PT-` | A parts line item: normalized to PTN, with supplier link. |
| `Customer` | `CX-` | Customer profile: history, segments, communication log. |
| `Vehicle` | `VH-` | YMME (Year/Make/Model/Engine) + VIN. |
| `Technician` | `TC-` | Shop employee profile with expertise graph. |
| `Supplier` | `SP-` | Parts vendor: pricing tiers, rebate programs, spiff programs. |
| `PartTerm` | `PTN-` | PCdb PartTerminologyName — canonical part identifier. |
| `PartAlias` | `PA-` | Alias, trade name, or NPT (Non-Preferred Term). |
| `TSB` | `TSB-` | Technical Service Bulletin from OEM or NHTSA. |
| `OEMMaintenanceSchedule` | `OMS-` | Factory maintenance schedule for a given YMME + mileage. |
| `LaborGuide` | `LG-` | External labor time standard (Mitchell, Alldata, Chilton). |
| `Inspection` | `INS-` | Digital Vehicle Inspection (DVI) report. |
| `InspectionItem` | `II-` | One line item within a DVI: OK / Monitor / Fail. |
| `ServiceAppointment` | `APT-` | Scheduled visit before or linked to an RO. |
| `CustomerInteraction` | `CI-` | Any touchpoint: call, SMS, email, social DM, review. |
| `Review` | `RV-` | Google/Yelp/social review tied to an RO or customer. |
| `Payment` | `PAY-` | Payment transaction linked to an RO. |
| `Rebate` | `RBT-` | Supplier rebate program entry earned on a part purchase. |
| `Spiff` | `SPF-` | Supplier spiff (technician or shop incentive on a part sale). |
| `Bay` | `BAY-` | A physical service bay in the shop — number, type, equipment. |
| `BayAssignment` | `BA-` | Time-bounded record of an RO assigned to a bay with a primary technician. |
| `ShopLocation` | `SL-` | Physical shop location (multi-location support). |

---

## 4. Repair Order: Full Lifecycle

### 4.1 Lifecycle Stages

```
INTAKE → INSPECTION → ESTIMATE → APPROVAL → IN-PROGRESS → QC → COMPLETE → INVOICED → PAID → CLOSED
```

Each stage is an edge label on the `RepairOrder` node's `status` history, timestamped and actor-attributed.

### 4.2 RepairOrder Node Schema

```json
{
  "id": "RO-20240315-00142",
  "edition": "AM",
  "shopId": "SL-001",
  "status": "COMPLETE",
  "statusHistory": [
    { "status": "INTAKE", "at": "2024-03-15T08:12:00Z", "by": "TC-007" }
  ],
  "vehicleId": "VH-1HGBH41JXMN109186",
  "customerId": "CX-00892",
  "mileageIn": 62400,
  "mileageOut": 62402,
  "promisedAt": "2024-03-15T17:00:00Z",
  "completedAt": "2024-03-15T14:45:00Z",
  "totalLaborHours": 3.2,
  "effectiveLaborRate": 195.00,
  "totalPartsAmount": 312.50,
  "totalLaborAmount": 624.00,
  "totalAmount": 936.50,
  "paymentIds": ["PAY-20240315-001"],
  "repairJobIds": ["RJ-001", "RJ-002"],
  "inspectionId": "INS-20240315-00142",
  "bayId": "BAY-03",
  "bayAssignmentId": "BA-20240315-00142",
  "summary": "Oil change, brake pad replacement front. Customer concern: grinding noise when braking.",
  "tags": ["repeat-customer", "brakes", "maintenance"],
  "createdAt": "2024-03-15T08:12:00Z",
  "updatedAt": "2024-03-15T14:52:00Z"
}
```

---

## 5. The 3C Model: Complaint → Cause → Correction

Every repair job within an RO is structured around the 3C model. This is the atomic unit of automotive diagnosis.

### 5.1 RepairJob Node Schema

```json
{
  "id": "RJ-001",
  "roId": "RO-20240315-00142",
  "sequence": 1,
  "source": "CUSTOMER_CONCERN",
  "complaint": "Grinding noise when applying brakes at low speed",
  "cause": "Front brake pads worn below minimum thickness (2mm). Rotors showing scoring.",
  "correction": "Replaced front brake pads (both sides). Resurfaced rotors. Test drove — noise resolved.",
  "laborOperationIds": ["LO-001", "LO-002"],
  "partIds": ["PT-001", "PT-002", "PT-003"],
  "tsbIds": [],
  "omsId": null,
  "assignedTechnicianId": "TC-004",
  "bayId": "BAY-03",
  "actualLaborHours": 1.5,
  "flatRateHours": 1.4,
  "summary": "Front brake pad replacement with rotor resurfacing due to grinding noise complaint.",
  "createdAt": "2024-03-15T08:30:00Z"
}
```

### 5.2 RepairJob Source Types

| Source | Description |
|--------|-------------|
| `CUSTOMER_CONCERN` | Customer-reported symptom or request |
| `DVI_FINDING` | Found during digital vehicle inspection |
| `TSB` | Triggered by a matching Technical Service Bulletin |
| `OEM_MAINTENANCE` | Pulled from OEM factory maintenance schedule |
| `ADVISOR_RECOMMENDATION` | Added by service advisor |
| `TECHNICIAN_FINDING` | Found by tech during another repair |

---

## 6. Labor Model

### 6.1 LaborOperation Node Schema

```json
{
  "id": "LO-001",
  "repairJobId": "RJ-001",
  "technicianId": "TC-004",
  "description": "Front brake pad replacement",
  "laborGuideRef": "LG-MITCHELL-BK-F-001",
  "flatRateHours": 1.1,
  "actualHoursClocked": 1.0,
  "laborRate": 195.00,
  "amount": 214.50,
  "clockIn": "2024-03-15T09:15:00Z",
  "clockOut": "2024-03-15T10:15:00Z",
  "efficiency": 1.10
}
```

### 6.2 Effective Labor Rate

Effective Labor Rate (ELR) = Total Labor Revenue / Total Actual Technician Hours

```
ELR = SUM(LaborOperation.amount) / SUM(LaborOperation.actualHoursClocked)
```

The ELR is tracked per:
- Individual technician (lifetime, 30-day, 90-day rolling)
- Shop location
- Vehicle type (German, Japanese, US)
- Labor category (drivetrain, electrical, HVAC, maintenance, etc.)

---

## 7. Parts Model

### 7.1 PCdb Normalization

All parts are normalized to the Auto Care Association **PCdb PartTerminologyName (PTN)**. This enables cross-supplier, cross-RO analytics.

```
Raw part description → NPT (Non-Preferred Term) → PT (Preferred Term) → PTN (PartTerminologyName)
```

Example:
- NPT: "brake pads", "disc pads", "friction material front"
- PT: "Disc Brake Pad Set"
- PTN: `Disc Brake Pad Set` (PCdb ID: 5678)

### 7.2 PartTerm Node Schema

```json
{
  "id": "PTN-5678",
  "partTerminologyId": 5678,
  "partTerminologyName": "Disc Brake Pad Set",
  "categoryId": 33,
  "categoryName": "Brake",
  "subcategoryId": 331,
  "subcategoryName": "Disc Brake",
  "aliases": ["PA-brake-pads", "PA-disc-pads", "PA-friction-pads"],
  "prediiNPTs": ["brake pads", "disc pads", "front friction material"],
  "prediiPT": "Disc Brake Pad Set"
}
```

### 7.3 Part (Line Item) Node Schema

```json
{
  "id": "PT-001",
  "repairJobId": "RJ-001",
  "ptnId": "PTN-5678",
  "supplierId": "SP-worldpac",
  "partNumber": "WPC-BP-5542F",
  "description": "Front Disc Brake Pad Set — OEM Quality",
  "brand": "ATE",
  "quantity": 1,
  "unitCost": 48.50,
  "unitPrice": 89.99,
  "totalPrice": 89.99,
  "margin": 0.461,
  "rebateIds": ["RBT-worldpac-q1-2024"],
  "spiffIds": ["SPF-ate-brake-q1"],
  "vehicleFitConfirmed": true,
  "fitSource": "fitmentApi",
  "createdAt": "2024-03-15T08:45:00Z"
}
```

### 7.4 PartAlias Node Schema

```json
{
  "id": "PA-disc-pads",
  "ptnId": "PTN-5678",
  "alias": "disc pads",
  "aliasType": "NPT",
  "source": "predii-nlp",
  "confidence": 0.98
}
```

---

## 8. Supplier, Rebate, and Spiff Model

### 8.1 Supplier Node Schema

```json
{
  "id": "SP-worldpac",
  "name": "Worldpac",
  "type": "PARTS",
  "accountNumber": "WPC-PAA-1042",
  "shopId": "SL-001",
  "pricingTier": "GOLD",
  "activeRebatePrograms": ["RBT-worldpac-q1-2024", "RBT-worldpac-annual-volume"],
  "activeSpiffPrograms": ["SPF-ate-brake-q1", "SPF-bilstein-suspension"],
  "contactEmail": "parts@worldpac.com",
  "apiIntegration": "worldpac-api-v2"
}
```

### 8.2 Rebate Node Schema

Rebates are earned by the **shop** when purchasing from a supplier above a threshold or in a qualifying category.

```json
{
  "id": "RBT-worldpac-q1-2024",
  "supplierId": "SP-worldpac",
  "shopId": "SL-001",
  "name": "Worldpac Q1 2024 Volume Rebate",
  "type": "VOLUME",
  "qualifyingPTNIds": ["PTN-5678", "PTN-5690", "PTN-5701"],
  "thresholdAmount": 5000.00,
  "currentSpend": 4820.00,
  "rebatePercent": 3.0,
  "rebateAmount": null,
  "status": "IN_PROGRESS",
  "periodStart": "2024-01-01",
  "periodEnd": "2024-03-31",
  "estimatedEarning": 144.60,
  "partIds": ["PT-001", "PT-044", "PT-089"]
}
```

### 8.3 Spiff Node Schema

Spiffs are per-unit incentives paid to the **technician** or **shop** for recommending/selling a specific brand or part.

```json
{
  "id": "SPF-ate-brake-q1",
  "supplierId": "SP-worldpac",
  "brand": "ATE",
  "name": "ATE Brake Q1 2024 Tech Spiff",
  "ptnIds": ["PTN-5678", "PTN-5702"],
  "spiffPerUnit": 5.00,
  "recipient": "TECHNICIAN",
  "technicianId": "TC-004",
  "unitsEarned": 3,
  "totalEarned": 15.00,
  "status": "PENDING_PAYMENT",
  "periodStart": "2024-01-01",
  "periodEnd": "2024-03-31"
}
```

---

## 9. Customer Profile

### 9.1 Customer Node Schema

```json
{
  "id": "CX-00892",
  "segment": "REPEAT",
  "lifetimeVisits": 14,
  "lifetimeSpend": 8420.50,
  "avgTicketSize": 601.46,
  "firstVisitAt": "2019-06-12",
  "lastVisitAt": "2024-03-15",
  "vehicleIds": ["VH-1HGBH41JXMN109186", "VH-1FA6P8CF5N5103291"],
  "preferredContactMethod": "SMS",
  "communicationOptIn": true,
  "openROIds": [],
  "closedROIds": ["RO-20240315-00142", "RO-20231104-00088"],
  "interactionIds": ["CI-001", "CI-002", "CI-045"],
  "reviewIds": ["RV-google-0451"],
  "trustScore": 92,
  "churnRisk": "LOW",
  "nextServiceDueAt": "2024-09-15",
  "nextServiceMileage": 68000,
  "tags": ["loyal", "import-owner", "on-time-payer"],
  "summary": "14-visit customer since 2019. Honda Civic and Ford Mustang. Prefers SMS. Low churn risk. Next oil service due Sep 2024."
}
```

### 9.2 Customer Interaction Node Schema

Each touchpoint — call, SMS, email, social DM, Google review, in-person — is recorded and linked to the customer and optionally to an RO.

```json
{
  "id": "CI-001",
  "customerId": "CX-00892",
  "roId": "RO-20240315-00142",
  "channel": "SMS",
  "direction": "INBOUND",
  "content": "Hi, when will my car be ready?",
  "sentiment": "NEUTRAL",
  "intent": "STATUS_INQUIRY",
  "handledBy": "AI_AGENT",
  "responseId": "CI-002",
  "at": "2024-03-15T11:30:00Z"
}
```

---

## 10. Vehicle Model

### 10.1 Vehicle Node Schema

```json
{
  "id": "VH-1HGBH41JXMN109186",
  "vin": "1HGBH41JXMN109186",
  "year": 2021,
  "make": "Honda",
  "model": "Civic",
  "trim": "EX",
  "engine": "1.5L Turbo I4",
  "transmission": "CVT",
  "drivetrain": "FWD",
  "color": "Sonic Gray Pearl",
  "mileage": 62402,
  "mileageUpdatedAt": "2024-03-15",
  "customerId": "CX-00892",
  "roIds": ["RO-20240315-00142", "RO-20231104-00088"],
  "tsbIds": ["TSB-Honda-2021-Civic-fuel-pump"],
  "omsIds": ["OMS-Honda-2021-Civic-60k"],
  "origin": "JAPANESE",
  "summary": "2021 Honda Civic EX 1.5T CVT. 62,402 miles. Open TSB for fuel pump recall."
}
```

### 10.2 Vehicle Origin Classification

Used for technician expertise matching:

| Origin | Makes |
|--------|-------|
| `JAPANESE` | Honda, Toyota, Nissan, Subaru, Mazda, Mitsubishi, Lexus, Acura, Infiniti |
| `GERMAN` | BMW, Mercedes-Benz, Audi, Volkswagen, Porsche, MINI |
| `DOMESTIC_US` | Ford, GM (Chevrolet, GMC, Buick, Cadillac), Chrysler/Stellantis (Dodge, Ram, Jeep) |
| `KOREAN` | Hyundai, Kia, Genesis |
| `EUROPEAN_OTHER` | Volvo, Jaguar, Land Rover, Fiat, Alfa Romeo |
| `DOMESTIC_TRUCK` | Ford F-Series, GM Sierra/Silverado, Ram |

---

## 11. Technician Expertise Graph

### 11.1 Technician Node Schema

```json
{
  "id": "TC-004",
  "name": "Marco Rivera",
  "shopId": "SL-001",
  "certifications": ["ASE-A1", "ASE-A5", "ASE-L1"],
  "specializations": ["BRAKES", "DRIVETRAIN", "SUSPENSION"],
  "vehicleOriginExpertise": {
    "JAPANESE": { "roCount": 142, "avgEfficiency": 1.12, "avgELR": 198.50 },
    "DOMESTIC_US": { "roCount": 89, "avgEfficiency": 1.08, "avgELR": 191.00 },
    "GERMAN": { "roCount": 23, "avgEfficiency": 0.94, "avgELR": 178.00 }
  },
  "laborCategoryExpertise": {
    "BRAKES": { "roCount": 98, "avgEfficiency": 1.18 },
    "SUSPENSION": { "roCount": 67, "avgEfficiency": 1.09 },
    "ENGINE": { "roCount": 34, "avgEfficiency": 0.97 }
  },
  "lifetimeLaborHours": 4820,
  "lifetimeELR": 194.20,
  "spiffEarnings30d": 45.00,
  "spiffEarningsYTD": 210.00,
  "roIds": ["RO-20240315-00142"],
  "summary": "Marco Rivera — ASE A1/A5/L1. Strong on Japanese vehicles and brakes. 1.12x efficiency on Japanese. 4,820 lifetime hours."
}
```

### 11.2 Expertise Edges (Tech → Vehicle/Category)

| Edge | From | To | Weight |
|------|----|-----|--------|
| `EXPERT_IN_ORIGIN` | Technician | VehicleOrigin | `roCount`, `avgEfficiency`, `avgELR` |
| `EXPERT_IN_CATEGORY` | Technician | LaborCategory | `roCount`, `avgEfficiency` |
| `EARNED_SPIFF` | Technician | Spiff | `unitsEarned`, `amount` |
| `CLOCKED_ON` | Technician | LaborOperation | `actualHours`, `efficiency` |

---

## 12. Bay and Bay Assignment

### 12.1 Bay Node Schema

A `Bay` represents a physical service bay in the shop. Each bay has a type, equipment list, and real-time availability status.

```json
{
  "id": "BAY-03",
  "shopId": "SL-001",
  "number": 3,
  "name": "Bay 3",
  "type": "GENERAL",
  "equipment": ["LIFT_2POST", "BRAKE_LATHE"],
  "specializations": ["BRAKES", "SUSPENSION", "DRIVETRAIN"],
  "status": "OCCUPIED",
  "currentROId": "RO-20240315-00142",
  "currentTechnicianId": "TC-004",
  "lastFreedAt": null,
  "avgTurnaroundMinutes": 87
}
```

#### Bay Types

| Type | Description |
|------|-------------|
| `GENERAL` | Standard lift bay — all-purpose repairs |
| `ALIGNMENT` | Alignment rack — wheel alignment only |
| `QUICK_LUBE` | Drive-through oil/filter/fluids |
| `ELECTRICAL` | Dedicated electrical diagnostic bay |
| `HEAVY_DUTY` | High-capacity lift for trucks and vans |
| `DETAIL` | Post-repair detailing and wash |

#### Bay Status Values

| Status | Meaning |
|--------|---------|
| `AVAILABLE` | Bay is empty and ready |
| `OCCUPIED` | Vehicle in bay, repair in progress |
| `PENDING_PICKUP` | Repair complete, awaiting customer |
| `OUT_OF_SERVICE` | Bay offline (maintenance, equipment failure) |

---

### 12.2 BayAssignment Node Schema

A `BayAssignment` records the full lifecycle of one RO's time in a bay: which bay, which technician is performing the work, start/end times, and any reassignments.

```json
{
  "id": "BA-20240315-00142",
  "roId": "RO-20240315-00142",
  "bayId": "BAY-03",
  "shopId": "SL-001",
  "primaryTechnicianId": "TC-004",
  "assignedAt": "2024-03-15T09:05:00Z",
  "startedAt": "2024-03-15T09:10:00Z",
  "completedAt": "2024-03-15T11:45:00Z",
  "durationMinutes": 155,
  "status": "COMPLETE",
  "reassignments": [],
  "repairJobIds": ["RJ-001", "RJ-002"],
  "notes": "Vehicle pulled from lot at 09:05. Tech clocked on at 09:10."
}
```

#### BayAssignment with Reassignment

When a technician is reassigned mid-job (e.g., pulled for a priority job), the `reassignments` array records the full handoff chain:

```json
{
  "id": "BA-20240316-00157",
  "roId": "RO-20240316-00157",
  "bayId": "BAY-01",
  "primaryTechnicianId": "TC-002",
  "assignedAt": "2024-03-16T08:30:00Z",
  "startedAt": "2024-03-16T08:35:00Z",
  "completedAt": "2024-03-16T13:20:00Z",
  "status": "COMPLETE",
  "reassignments": [
    {
      "fromTechnicianId": "TC-002",
      "toTechnicianId": "TC-006",
      "at": "2024-03-16T10:15:00Z",
      "reason": "TC-002 pulled for priority engine job in Bay 4",
      "repairJobIds": ["RJ-003"]
    }
  ]
}
```

#### BayAssignment Status Values

| Status | Meaning |
|--------|---------|
| `SCHEDULED` | Bay reserved for this RO at a future time |
| `PENDING` | RO assigned, vehicle not yet in bay |
| `ACTIVE` | Technician actively working |
| `PAUSED` | Work paused (waiting for parts, tech on break) |
| `COMPLETE` | All repair jobs finished, bay freed |
| `REASSIGNED` | Primary tech changed mid-job |

---

### 12.3 Bay Occupancy and Throughput Analytics

The Bay graph enables real-time and historical throughput analysis:

```cypher
// Current bay utilization across shop
MATCH (bay:Bay {shopId: $shopId})
RETURN bay.number, bay.status, bay.currentTechnicianId,
       bay.avgTurnaroundMinutes
ORDER BY bay.number

// Avg time in bay by repair category (last 30 days)
MATCH (ba:BayAssignment)-[:ASSIGNED_JOBS]->(rj:RepairJob)
WHERE ba.completedAt > datetime() - duration('P30D')
  AND ba.shopId = $shopId
RETURN rj.laborCategory,
       avg(ba.durationMinutes) as avgMinutes,
       count(ba) as jobCount
ORDER BY avgMinutes DESC
```

#### Derived Metrics from Bay Graph

| Metric | Formula |
|--------|---------|
| **Bay Utilization %** | `OCCUPIED minutes / total open hours` per bay |
| **Avg Cycle Time** | `mean(BayAssignment.durationMinutes)` by repair category |
| **Tech-to-Bay Ratio** | `active techs / occupied bays` (target ≥ 0.95) |
| **Idle Bay Rate** | `AVAILABLE bays during open hours / total bay-hours` |
| **Reassignment Rate** | `BayAssignments with reassignments / total` — signals scheduling friction |

---

## 13. Technical Service Bulletins (TSBs)

### 13.1 TSB Node Schema

```json
{
  "id": "TSB-Honda-2021-Civic-fuel-pump",
  "source": "NHTSA",
  "oem": "Honda",
  "tsbnumber": "21-064",
  "title": "Fuel Pump Module May Fail — 2021 Civic 1.5T",
  "applicableYears": [2020, 2021, 2022],
  "applicableMakes": ["Honda"],
  "applicableModels": ["Civic"],
  "applicableEngines": ["1.5L Turbo I4"],
  "laborOperationCode": "17030-5BA-A01",
  "recommendedLaborHours": 2.0,
  "recommendedPartIds": [],
  "recommendedPTNIds": ["PTN-fuel-pump-module"],
  "description": "Fuel pump module may lose prime under certain conditions, causing extended crank or no-start.",
  "severity": "SAFETY",
  "isRecall": false,
  "publishedAt": "2021-08-15",
  "vehicleIds": ["VH-1HGBH41JXMN109186"]
}
```

### 13.2 TSB Matching Logic

When a vehicle is added to an RO:
1. Query TSB nodes by YMME match
2. Surface matching TSBs to the service advisor
3. If TSB labor/parts match `RepairJob`, auto-link `tsbIds` to `RepairJob`
4. Advisor can add TSB-sourced `RepairJob` entries to RO

---

## 14. OEM Maintenance Schedule

### 14.1 OEMMaintenanceSchedule Node Schema

```json
{
  "id": "OMS-Honda-2021-Civic-60k",
  "source": "ALLDATA",
  "oem": "Honda",
  "year": 2021,
  "make": "Honda",
  "model": "Civic",
  "engine": "1.5L Turbo I4",
  "mileageInterval": 60000,
  "monthInterval": null,
  "title": "Honda 60,000 Mile Service",
  "scheduledJobs": [
    {
      "description": "Engine Air Filter Replacement",
      "ptnIds": ["PTN-air-filter"],
      "laborHours": 0.3,
      "laborCode": "17220-59B-Y00"
    },
    {
      "description": "Spark Plug Replacement",
      "ptnIds": ["PTN-spark-plug"],
      "laborHours": 1.2,
      "laborCode": "12290-5LA-A01"
    },
    {
      "description": "Brake Fluid Replacement",
      "ptnIds": ["PTN-brake-fluid"],
      "laborHours": 0.5,
      "laborCode": "45251-S84-A02"
    }
  ],
  "estimatedLaborAmount": 390.00,
  "estimatedPartsAmount": 145.00,
  "estimatedTotal": 535.00
}
```

---

## 15. Digital Vehicle Inspection (DVI)

### 15.1 Inspection Node Schema

```json
{
  "id": "INS-20240315-00142",
  "roId": "RO-20240315-00142",
  "vehicleId": "VH-1HGBH41JXMN109186",
  "technicianId": "TC-004",
  "startedAt": "2024-03-15T08:30:00Z",
  "completedAt": "2024-03-15T09:10:00Z",
  "overallCondition": "FAIR",
  "itemIds": ["II-001", "II-002", "II-003", "II-004"],
  "photosCount": 6,
  "videoCount": 1,
  "sharedWithCustomerAt": "2024-03-15T09:15:00Z",
  "customerApprovalAt": "2024-03-15T09:32:00Z",
  "approvedJobIds": ["RJ-001"],
  "declinedJobIds": [],
  "summary": "Front brakes worn, rotors scored. Air filter dirty. Tires even wear at 60%. Fluids OK."
}
```

### 15.2 InspectionItem Node Schema

```json
{
  "id": "II-001",
  "inspectionId": "INS-20240315-00142",
  "category": "BRAKES",
  "component": "Front Brake Pads",
  "ptnId": "PTN-5678",
  "status": "FAIL",
  "measurement": "2mm",
  "threshold": "3mm minimum",
  "urgency": "IMMEDIATE",
  "technicianNote": "Metal-on-metal contact risk. Recommend immediate replacement.",
  "photoUrls": ["s3://wrenchiq-media/ins/II-001-photo1.jpg"],
  "generatedROJobId": "RJ-001"
}
```

---

## 16. Labor Guide Integration

### 16.1 LaborGuide Node Schema

```json
{
  "id": "LG-MITCHELL-BK-F-001",
  "source": "MITCHELL1",
  "vehicleId": "VH-1HGBH41JXMN109186",
  "ptnId": "PTN-5678",
  "operationCode": "BRK-FRONT-PAD-REPLACE",
  "description": "Front Disc Brake Pad Replacement",
  "flatRateHours": 1.1,
  "additionalNotes": "Add 0.3hr if rotor resurfacing required",
  "fetchedAt": "2024-03-15T08:20:00Z",
  "source_version": "mitchell1-prodemand-2024-Q1"
}
```

---

## 17. Knowledge Graph Edge Taxonomy

### 17.1 Full Edge Map

```
RepairOrder ──[HAS_JOB]──────────────→ RepairJob
RepairOrder ──[FOR_VEHICLE]──────────→ Vehicle
RepairOrder ──[FOR_CUSTOMER]─────────→ Customer
RepairOrder ──[HAS_INSPECTION]───────→ Inspection
RepairOrder ──[HAS_PAYMENT]──────────→ Payment
RepairOrder ──[ASSIGNED_TO_BAY]──────→ Bay
RepairOrder ──[HAS_BAY_ASSIGNMENT]───→ BayAssignment

RepairJob ───[HAS_CONCERN]───────────→ CustomerConcern
RepairJob ───[HAS_LABOR]─────────────→ LaborOperation
RepairJob ───[HAS_PART]──────────────→ Part
RepairJob ───[TRIGGERED_BY_TSB]──────→ TSB
RepairJob ───[TRIGGERED_BY_OMS]──────→ OEMMaintenanceSchedule
RepairJob ───[TRIGGERED_BY_DVI]──────→ InspectionItem
RepairJob ───[ASSIGNED_TO_TECH]──────→ Technician
RepairJob ───[PERFORMED_IN_BAY]──────→ Bay

BayAssignment ──[IN_BAY]─────────────→ Bay
BayAssignment ──[PRIMARY_TECH]───────→ Technician
BayAssignment ──[FOR_RO]─────────────→ RepairOrder
BayAssignment ──[COVERS_JOBS]────────→ RepairJob

Bay ─────────[BELONGS_TO]────────────→ ShopLocation
Bay ─────────[CURRENTLY_OCCUPIED_BY]─→ Technician

LaborOperation ──[PERFORMED_BY]──────→ Technician
LaborOperation ──[GUIDED_BY]─────────→ LaborGuide
LaborOperation ──[CLOCKED_IN_BAY]────→ Bay

Part ────────[NORMALIZED_TO]─────────→ PartTerm (PTN)
Part ────────[SOURCED_FROM]──────────→ Supplier
Part ────────[EARNED_REBATE]─────────→ Rebate
Part ────────[EARNED_SPIFF]──────────→ Spiff
Part ────────[FITS_VEHICLE]──────────→ Vehicle

PartTerm ───[HAS_ALIAS]──────────────→ PartAlias
PartTerm ───[IN_CATEGORY]────────────→ PartCategory

Technician ─[EXPERT_IN_ORIGIN]───────→ VehicleOrigin
Technician ─[EXPERT_IN_CATEGORY]─────→ LaborCategory
Technician ─[EARNED_SPIFF]───────────→ Spiff

Customer ───[OWNS_VEHICLE]───────────→ Vehicle
Customer ───[HAD_INTERACTION]────────→ CustomerInteraction
Customer ───[LEFT_REVIEW]────────────→ Review
Customer ───[HAS_APPOINTMENT]────────→ ServiceAppointment

Vehicle ────[MATCHES_TSB]────────────→ TSB
Vehicle ────[HAS_SCHEDULE]───────────→ OEMMaintenanceSchedule
Vehicle ────[OF_ORIGIN]──────────────→ VehicleOrigin

Supplier ───[OFFERS_REBATE]──────────→ Rebate
Supplier ───[OFFERS_SPIFF]───────────→ Spiff
```

---

## 18. AI Insight Layer

The AI Insight layer operates on top of the RO-KG. Every insight is typed, linked to its source nodes, and surfaced contextually in the WrenchIQ UI.

### 18.1 Insight Types

| Insight Type | Description | Source Nodes |
|---|---|---|
| `NEXT_SERVICE_DUE` | Predicted next visit date/mileage based on OMS + history | Customer, Vehicle, OMS |
| `TSB_MATCH` | Open TSB matching vehicle on current RO | Vehicle, TSB |
| `BAY_MISMATCH` | Job requires specialized bay (alignment, electrical) but assigned to general bay | RepairJob, Bay |
| `BAY_IDLE` | Bay unoccupied during peak hours — scheduling gap | Bay, ShopLocation |
| `SUPPLIER_REBATE_NUDGE` | Shop is near a rebate threshold — suggest this supplier | Supplier, Rebate, Part |
| `TECHNICIAN_MISMATCH` | Job requires German expertise but assigned to tech with low German score | Technician, Vehicle |
| `UPSELL_OPPORTUNITY` | DVI finding not approved — follow up in 30 days | InspectionItem, Customer |
| `PARTS_PRICE_ALERT` | Preferred supplier price increased >15% vs 90-day avg | Part, Supplier |
| `CUSTOMER_CHURN_RISK` | Customer is 60+ days past expected service date | Customer |
| `ELR_BELOW_TARGET` | Technician ELR dropped below shop target | Technician, LaborOperation |
| `SPIFF_EXPIRING` | Spiff program ends in 7 days, unclaimed units remaining | Spiff, Technician |
| `PATTERN_FAILURE` | Same PTN failed on 3+ vehicles same YMME this month | Part, PartTerm, Vehicle |
| `CUSTOMER_VIP` | High LTV customer in shop — personalize interaction | Customer |

### 18.2 Insight Node Schema

```json
{
  "id": "INS-AI-00441",
  "type": "TSB_MATCH",
  "priority": "HIGH",
  "title": "Open Honda TSB 21-064 matches this vehicle",
  "body": "Vehicle VIN 1HGBH41JXMN109186 matches Honda TSB 21-064 (Fuel Pump Module Failure). Consider adding to this RO.",
  "sourceNodeIds": ["VH-1HGBH41JXMN109186", "TSB-Honda-2021-Civic-fuel-pump"],
  "roId": "RO-20240315-00142",
  "customerId": "CX-00892",
  "shownAt": "2024-03-15T08:12:00Z",
  "actionTaken": "ADDED_TO_RO",
  "actionAt": "2024-03-15T08:20:00Z"
}
```

---

## 19. LLM Contextual Graph Access

The LLM (Claude) receives a structured context object assembled from the RO-KG at each interaction. This enables grounded, factual, shop-specific answers.

### 19.1 LLM Context Assembly

For a given RO interaction, the context object includes:

```
{
  repairOrder: <RepairOrder node>,
  vehicle: <Vehicle node + YMME + VIN decode>,
  customer: <Customer node + interaction history>,
  repairJobs: [<RepairJob + 3C + parts + labor + assignedTechnicianId + bayId>],
  bayAssignment: <BayAssignment node + bay type + technician>,
  openTSBs: [<matching TSB nodes>],
  nextOMS: <next due OMS node>,
  technicianProfile: <assigned tech expertise>,
  supplierRebates: [<active rebate progress>],
  aiInsights: [<active insight nodes for this RO>],
  laborGuide: <flat rate refs for open operations>,
  inspectionSummary: <DVI findings summary>
}
```

### 19.2 LLM Usage Patterns

| Pattern | Trigger | Output |
|---|---|---|
| Complaint narration | Advisor types customer concern | AI drafts `complaint` field using YMME + symptom |
| Cause recommendation | 3C form — cause field | Ranked likely causes from graph patterns + TSBs |
| Correction drafting | Cause confirmed | Suggested correction language for RO |
| Customer SMS | RO status changes | Friendly, plain-English SMS draft |
| Estimate explanation | Customer asks "why so much?" | Human-readable breakdown from graph context |
| Rebate coaching | Advisor on parts screen | "You're $180 from Q1 Worldpac rebate — swap brand?" |
| Tech assignment | New RO with German vehicle | "Marco has low German vehicle score — reassign?" |

---

## 20. Shop-Level Aggregate Graph

Beyond individual ROs, the graph supports aggregate shop-level queries:

| Query | Graph Pattern | Output |
|---|---|---|
| Most common repairs by YMME | RepairJob → Vehicle | Top 10 repair types per make/model |
| Parts failure rate by PTN | Part → PartTerm + ROclosedAt | PTNs with >3% comeback rate |
| Technician efficiency by category | LaborOperation → Technician | ELR leaderboard, specialization gaps |
| Supplier rebate pipeline | Rebate → Part → Supplier | Total shop rebate exposure vs earned |
| Customer retention by segment | Customer → RO date range | 30/90/180 day retention cohort |
| Revenue by vehicle origin | RepairOrder → Vehicle origin | Revenue split: Japanese/German/US |
| TSB capture rate | TSB + Vehicle match vs RO TSB link | % of eligible TSBs added to ROs |
| Bay utilization | BayAssignment duration / shop open hours | % utilization per bay, idle time |
| Avg cycle time by repair category | BayAssignment → RepairJob category | Minutes per job type in bay |
| Tech reassignment rate | BayAssignment.reassignments count | Scheduling friction indicator |

---

## 21. Customer-Facing Knowledge Graph View

For each customer, a visual graph is surfaced in the customer portal:

- Vehicle timeline: all ROs on a horizontal axis with mileage
- Service categories completed (color-coded rings)
- Upcoming services predicted (based on OMS + history)
- Trust score and loyalty tier
- Active incentives (if shop shares rebate savings)

---

## 22. Visualization

### 22.1 Shop Admin — Aggregate Graph View

- Node types: Customer (blue), Vehicle (gray), Technician (green), Supplier (orange), Part (purple), TSB (red), Bay (teal)
- Edge thickness = transaction volume
- Filters: date range, vehicle origin, repair category, technician, bay
- Hot nodes: highlighted when AI insight is active

### 22.2 Per-RO Graph View

- Focused subgraph for one RO
- Expands: click any node to see its full schema
- Highlights: TSB matches, rebate-eligible parts, tech mismatch warnings

### 22.3 Customer Timeline View

- Horizontal RO timeline per vehicle
- Vertical axis: cost
- Hover: 3C summary, parts, tech

---

## 23. External Data Provider Integration

| Provider | Data Type | Node Feed |
|---|---|---|
| NHTSA | TSBs, Recalls | `TSB` nodes |
| ALLDATA | OEM Maintenance Schedules, Labor Guide | `OEMMaintenanceSchedule`, `LaborGuide` |
| Mitchell1 ProDemand | Labor Guide | `LaborGuide` |
| Worldpac | Parts pricing, fitment | `Part`, `Supplier` |
| PartsTech | Multi-supplier parts catalog | `Part`, `Supplier` |
| O'Reilly | Parts pricing | `Part`, `Supplier` |
| PCdb (Auto Care Assoc.) | PartTerminologyName master data | `PartTerm`, `PartAlias` |
| Predii NLP | NPT → PT → PTN mapping | `PartAlias`, `PartTerm` |

---

## 24. Legacy SMS Integration Notes

When ingesting data from legacy SMS platforms (Mitchell1, Tekmetric, ShopWare, DealerSocket, Reynolds & Reynolds):

1. **RO import:** Map legacy RO fields to `RepairOrder` schema. Source `laborLine` to `LaborOperation`. Source `partsLine` to `Part`.
2. **Part normalization:** Run Predii NLP pipeline on raw part descriptions to produce PTN mapping.
3. **Customer dedup:** Match on phone + VIN to resolve duplicate customer records before importing.
4. **Labor guide backfill:** Re-query Mitchell1/ALLDATA for flat-rate hours if not stored in legacy SMS.
5. **TSB retroactive match:** After VIN import, run TSB matching against all historical vehicles.

---

## 25. Implementation Phases

| Phase | Scope |
|---|---|
| **Phase 1 — Core RO Graph** | RepairOrder, RepairJob (3C), LaborOperation, Part, Customer, Vehicle, Bay, BayAssignment nodes + edges |
| **Phase 2 — Parts Intelligence** | PCdb normalization, Supplier, Rebate, Spiff, PartTerm, PartAlias |
| **Phase 3 — External Feeds** | TSB ingestion, OEM Maintenance Schedule, Labor Guide links |
| **Phase 4 — Technician Graph** | Expertise scoring, ELR tracking, Spiff assignment |
| **Phase 5 — AI Insight Engine** | Insight nodes, LLM context assembly, pattern detection |
| **Phase 6 — Visualization** | Per-RO graph view, shop aggregate dashboard, customer timeline |
| **Phase 7 — Legacy SMS Import** | ETL pipeline, part normalization, dedup, backfill |
