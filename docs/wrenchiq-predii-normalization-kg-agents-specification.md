# WrenchIQ.ai — Predii Normalization, Knowledge Graph & LLM Agents Specification

**Version:** 1.2
**Date:** 2026-03-30
**Author:** Predii, Inc.
**Status:** Draft
**Confluence:** NextGen Project Hub > Predii Normalization, Knowledge Graph & LLM Agents

---

## Executive Summary

This specification covers three tightly coupled capability pillars that form the AI-native intelligence layer of WrenchIQ.ai:

1. **Predii Normalization** — Converting raw, inconsistent automotive data (parts descriptions, labor operations, complaints, DTCs, VINs) into structured, canonical representations aligned to industry standards.
2. **Predii Knowledge Graph (PKG)** — A property graph database connecting every entity in the repair lifecycle — vehicles, customers, parts, technicians, suppliers, TSBs, maintenance schedules — with typed, weighted edges.
3. **LLM-Powered Agents** — Purpose-built AI agents that operate on PKG context to automate, advise, and act across the repair order lifecycle.

Together these pillars transform a legacy Shop Management System from a data recorder into an intelligence system.

---

# PART I — PREDII NORMALIZATION

---

## 1. What Is Predii Normalization?

Legacy SMS platforms store automotive data in free-text fields — technician notes, part descriptions typed differently by every counter person, complaint narratives written in shorthand. The same part may be called "brake pads", "disc pads", "front friction set", or "BRK PAD FT" depending on who typed it.

Predii Normalization is the pipeline that converts this noise into structured signals:

```
Raw Input
  ↓
[Entity Detection]
  ↓
[Classification + Disambiguation]
  ↓
[Canonical Mapping]
  ↓
Normalized Output → Knowledge Graph Node
```

---

## 2. Normalization Domains

### 2.1 Parts Normalization (NPT → PT → PTN)

The most critical normalization pipeline. Every part description — from any source — is resolved to its canonical **PCdb PartTerminologyName (PTN)**.

#### Normalization Chain

```
Raw text → Non-Preferred Term (NPT) → Preferred Term (PT) → PartTerminologyName (PTN)
```

| Level | Owner | Example |
|-------|-------|---------|
| Raw text | Shop / supplier / tech | "brk pads fr", "front friction material", "disc pads OEM quality" |
| NPT | Predii NLP | "brake pads", "disc pads", "front friction" |
| PT | Predii / PCdb | "Disc Brake Pad Set" |
| PTN | PCdb (Auto Care Assoc.) | `Disc Brake Pad Set` (ID: 5678) |

#### Pipeline Steps

**Step 1 — Tokenization & Normalization**
- Lowercase, strip punctuation, expand abbreviations
- `brk → brake`, `fr → front`, `rr → rear`, `cyl → cylinder`, `alt → alternator`

**Step 2 — Named Entity Recognition (NER)**
- Identify part-related tokens vs noise (brand names, quantities, qualifiers)
- Model: fine-tuned on 2M+ automotive part descriptions from Predii corpus

**Step 3 — Category Classification**
- Predict part category (Brakes / Filters / Electrical / Engine / Suspension / HVAC / etc.)
- Multi-label: a "brake rotor kit" spans Brakes + Friction

**Step 4 — PTN Candidate Ranking**
- Retrieve top-5 PTN candidates from PCdb vector index
- Score by: semantic similarity + category alignment + vehicle fitment compatibility
- Return ranked list with confidence scores

**Step 5 — Disambiguation**
- If top candidate confidence > 0.92: auto-accept
- If 0.70–0.92: surface to advisor for one-click confirmation
- If < 0.70: flag for human review + add to NPT training corpus

**Step 6 — Alias Registration**
- Accepted NPT → PTN mapping is stored as a `PartAlias` node
- Future occurrences of same NPT auto-resolve without ML inference

#### Part Alias Hierarchy

```
PTN: "Disc Brake Pad Set" (PCdb 5678)
 ├── PT aliases: "Brake Pad Set", "Front Disc Brake Pads"
 ├── NPT aliases: "brake pads", "disc pads", "brk pad fr", "front friction"
 ├── Supplier SKUs: WPC-BP-5542F (Worldpac), ORL-BP-2291 (O'Reilly)
 └── OEM codes: 45022-T20-A01 (Honda), D1210 (StopTech)
```

#### Normalization Metrics

| Metric | Target |
|--------|--------|
| Auto-resolution rate | >92% |
| PTN accuracy (precision) | >97% |
| Novel NPT coverage (recall) | >88% |
| Avg latency per part | <120ms |

---

### 2.2 Complaint Normalization

Customer complaints arrive as unstructured natural language: "makes a clunking noise when I go over bumps", "check engine light came on yesterday". Complaint normalization extracts structured diagnostic signals.

#### Pipeline

```
Raw complaint text
  ↓
[Symptom Extraction] → symptom tokens
  ↓
[System Classification] → affected system (Suspension / Engine / Brakes / etc.)
  ↓
[Severity Scoring] → urgency (SAFETY / SOON / MONITOR / MAINTENANCE)
  ↓
[DTC Hint Detection] → possible DTC family (P0xxx, C0xxx, B0xxx, U0xxx)
  ↓
[Graph Lookup] → similar complaints on same YMME → candidate causes
```

#### Structured Complaint Output

```json
{
  "raw": "Car makes a grinding noise when I brake, especially at low speed",
  "symptoms": ["grinding noise", "braking"],
  "affectedSystems": ["BRAKES"],
  "severity": "IMMEDIATE",
  "dtcHints": [],
  "candidateCauses": [
    { "cause": "Worn brake pads", "confidence": 0.94, "ptnIds": ["PTN-5678"] },
    { "cause": "Scored rotors", "confidence": 0.87, "ptnIds": ["PTN-5702"] },
    { "cause": "Loose caliper hardware", "confidence": 0.41, "ptnIds": ["PTN-5810"] }
  ],
  "ymmeMatchCount": 34
}
```

---

### 2.3 DTC Normalization

Diagnostic Trouble Codes arrive from scan tools in raw form: `P0301`, `C0035`, `U0073`. Predii maps each DTC to a structured record enriched with graph context.

#### DTC Node Schema

```json
{
  "id": "DTC-P0301",
  "code": "P0301",
  "system": "POWERTRAIN",
  "category": "MISFIRE",
  "description": "Cylinder 1 Misfire Detected",
  "affectedSystems": ["ENGINE", "IGNITION", "FUEL"],
  "commonCauses": [
    { "cause": "Faulty spark plug", "ptnId": "PTN-spark-plug", "frequency": 0.62 },
    { "cause": "Faulty ignition coil", "ptnId": "PTN-ignition-coil", "frequency": 0.41 },
    { "cause": "Fuel injector clogged", "ptnId": "PTN-fuel-injector", "frequency": 0.28 }
  ],
  "relatedTSBIds": ["TSB-Honda-2021-Civic-misfire"],
  "avgLaborHours": 1.8,
  "avgPartsAmount": 120.00
}
```

#### DTC → Repair Job Bridge

When a DTC is scanned during DVI:
1. DTC node is created and linked to `InspectionItem`
2. `commonCauses` are surfaced to the technician as ranked hypotheses
3. Matching TSBs are fetched and displayed
4. A `RepairJob` template is pre-populated (complaint = DTC description, cause candidates ranked, suggested parts list)

---

### 2.4 Labor Operation Normalization

Each shop has its own labor description conventions. Predii normalizes these to a standard `LaborOperationCode` that maps to a `LaborGuide` entry.

```
Shop text: "R&R front brakes both sides"
  ↓
Normalized: LaborOp Category: BRAKES | Sub: DISC_BRAKE | Position: FRONT | Operation: REPLACE
  ↓
LaborGuide code: BRK-DISC-FRONT-RR (Mitchell1), 04000 (ALLDATA)
  ↓
Flat-rate hours: 1.1 (2021 Honda Civic)
```

---

### 2.5 VIN / YMME Normalization

VIN decoding produces a canonical YMME record enriched with Predii classifications.

```json
{
  "vin": "1HGBH41JXMN109186",
  "year": 2021,
  "make": "Honda",
  "model": "Civic",
  "trim": "EX",
  "engine": "1.5L Turbo I4",
  "engineDisplacement": 1.5,
  "fuelType": "GASOLINE",
  "driveType": "FWD",
  "transmission": "CVT",
  "origin": "JAPANESE",
  "segment": "COMPACT_CAR",
  "laborMultiplier": 1.0,
  "partsAvailability": "HIGH",
  "avgRoValue": 520.00
}
```

`laborMultiplier` adjusts flat-rate estimates for vehicle complexity (German luxury = 1.15–1.30x, domestic trucks = 1.0x).

---

### 2.6 Technician Note Normalization

Free-text technician notes are parsed post-repair to extract structured findings for the graph:

```
Raw note: "replaced front pads and resurfaced rotors, also noticed rear pads at 30%,
           recommend replacement at next visit, ATF level low topped off"
  ↓
Extracted findings:
  - Completed: PTN-5678 (Disc Brake Pad Set) replaced FRONT
  - Completed: PTN-5702 (Disc Brake Rotor) resurfaced FRONT
  - Monitor: PTN-5679 (Disc Brake Pad Set REAR) 30% life → InspectionItem status=MONITOR
  - Finding: PTN-ATF (Automatic Transmission Fluid) level low → topped off
```

Each extracted finding is stored as an `InspectionItem` node and linked back to the RO.

---

# PART II — PREDII KNOWLEDGE GRAPH (PKG)

---

## 3. Architecture

### 3.1 Graph Database

- **Primary store:** Neo4j AuraDB (managed) — property graph with Cypher query language
- **Vector index:** pgvector (PostgreSQL) or Weaviate — for node embedding storage and RAG retrieval
- **Event store:** MongoDB — append-only event log for every node mutation
- **Cache layer:** Redis — hot subgraphs for active ROs (TTL 4 hours)

### 3.2 Graph Topology

```
                    ┌─────────────────┐
                    │   RepairOrder   │ ◄── Central document
                    └────────┬────────┘
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
        [Vehicle]       [Customer]      [RepairJob × N]
             │               │               │
        [TSB × N]     [Interaction × N] [LaborOp × N]
        [OMS × N]     [Review × N]      [Part × N]
        [VIN decode]  [Appointment]         │
                                    [PartTerm (PTN)]
                                    [Supplier]
                                    [Rebate]
                                    [Spiff]
                                    [Technician]
                                    [LaborGuide]
```

### 3.3 Multi-Tenancy

Each `ShopLocation` owns its subgraph. Queries are always scoped by `shopId` first.

Aggregate queries (e.g. cross-shop repair patterns for corporate groups) run on anonymized aggregate nodes — never exposing one shop's data to another.

```
ShopLocation (SL-001) → owns → RepairOrder, Customer, Vehicle, Technician
ShopLocation (SL-AGGREGATE) → anonymized rollup → PartFailurePattern, LaborBenchmark
```

---

## 4. Graph Layers

### 4.1 Layer 1 — Operational Graph

Real-time data from active repair orders, appointments, DVI sessions, and customer interactions. Updated continuously as events occur.

**Key Queries:**
```cypher
// All active ROs for a shop
MATCH (ro:RepairOrder {shopId: $shopId, status: 'IN_PROGRESS'})
RETURN ro, ro.vehicleId, ro.customerId

// TSBs matching vehicle on intake
MATCH (v:Vehicle {id: $vehicleId})-[:MATCHES_TSB]->(tsb:TSB)
WHERE tsb.status = 'OPEN'
RETURN tsb ORDER BY tsb.severity DESC
```

### 4.2 Layer 2 — Historical Graph

All closed ROs, their 3C data, parts used, technician performance, and customer interaction history. This is the training ground for pattern detection.

**Key Queries:**
```cypher
// Most common causes for a complaint on a YMME
MATCH (rj:RepairJob)-[:ASSIGNED_TO_VEHICLE]->(v:Vehicle {make: $make, model: $model})
WHERE rj.complaint CONTAINS $symptom
RETURN rj.cause, count(*) as frequency
ORDER BY frequency DESC LIMIT 10

// Technician efficiency on German vehicles, last 90 days
MATCH (lo:LaborOperation)-[:PERFORMED_BY]->(tc:Technician {id: $techId})
MATCH (lo)-[:FOR_VEHICLE]->(v:Vehicle {origin: 'GERMAN'})
WHERE lo.clockOut > datetime() - duration('P90D')
RETURN avg(lo.efficiency) as avgEff, sum(lo.amount) as totalRevenue
```

### 4.3 Layer 3 — Predictive Graph

Derived nodes and edges created by ML models running over Layers 1 and 2. These nodes are tagged with `source: PREDICTED` and a `confidence` score.

**Derived Node Types:**
| Node | How Derived | Example |
|------|-------------|---------|
| `PredictedNextService` | OMS + last service date + avg mileage/month | "Honda Civic SL-001: next oil due 2024-09-15" |
| `ChurnRiskScore` | Days since last visit + visit frequency model | CX-00892: churnRisk=LOW, score=0.12 |
| `PartFailurePattern` | PTN failure rate > threshold on same YMME | "PTN-5678 on 2018-2022 Honda Civic: 4.2% comeback" |
| `TechnicianExpertiseScore` | RO count × efficiency × recency on origin/category | TC-004: JAPANESE expertise = 8.7/10 |
| `RevenueOpportunity` | Declined DVI items × avg ticket for that PTN | CX-00892: $380 opportunity (rear brakes, air filter) |

### 4.4 Layer 4 — Embedding Graph

Every node with a `summary` field is embedded into a 1536-dimension vector and stored in the vector index. This enables semantic search and RAG retrieval.

**Embedded Node Types:**
- `RepairJob` (3C narrative)
- `CustomerConcern` (symptom text)
- `TSB` (title + description)
- `InspectionItem` (technician note)
- `CustomerInteraction` (message content)
- `OEMMaintenanceSchedule` (job descriptions)
- `Vehicle` (YMME + history summary)

**RAG Retrieval Pattern:**
```
User query: "Why does the 2021 Civic make a grinding noise when braking?"
  ↓
Embed query → vector search → top-10 similar RepairJob nodes
  ↓
Filter by: Vehicle.make=Honda, Vehicle.model=Civic, Vehicle.year=2021
  ↓
Return: ranked cause candidates + correction patterns from graph
```

---

## 5. Graph Analytics

### 5.1 Repair Pattern Detection

```cypher
// Find PTN with abnormal comeback rate on a YMME
MATCH (p:Part)-[:NORMALIZED_TO]->(ptn:PartTerm)
MATCH (p)-[:USED_IN]->(rj:RepairJob)-[:PART_OF]->(ro:RepairOrder)
MATCH (ro)-[:FOR_VEHICLE]->(v:Vehicle {make: $make, model: $model, year: $year})
WHERE ro.status = 'CLOSED'
WITH ptn, count(p) as totalInstalls,
     sum(CASE WHEN ro.isComeback = true THEN 1 ELSE 0 END) as comebacks
WHERE totalInstalls > 10
RETURN ptn.partTerminologyName, comebacks * 1.0 / totalInstalls as comebackRate
ORDER BY comebackRate DESC
```

### 5.2 Technician Expertise Scoring

Expertise is scored on two axes: **volume** (how many ROs on this origin/category) and **quality** (average efficiency + ELR vs shop benchmark).

```
ExpertiseScore(tech, origin) =
  0.4 × normalize(roCount) +
  0.4 × normalize(avgEfficiency) +
  0.2 × normalize(avgELR / shopBenchmarkELR)
```

Score range: 0.0–10.0. Displayed in advisor UI when assigning technicians.

### 5.3 Customer Lifetime Value (CLV) Projection

```
CLV = avgTicketSize × expectedVisitsPerYear × predictedRetentionYears
predictedRetentionYears = f(visitFrequency, lastVisitGap, trustScore, vehicleAge)
```

### 5.4 Supplier Rebate Intelligence

```cypher
// Show rebate gap to threshold for each active program
MATCH (shop:ShopLocation {id: $shopId})-[:HAS_REBATE]->(rbt:Rebate {status: 'IN_PROGRESS'})
RETURN rbt.name, rbt.thresholdAmount - rbt.currentSpend as gapToThreshold,
       rbt.rebatePercent, rbt.estimatedEarning, rbt.periodEnd
ORDER BY gapToThreshold ASC
```

---

## 6. Graph Event Sourcing

Every write to the graph is an immutable event appended to the event store. The graph state at any point in time can be reconstructed.

```json
{
  "eventId": "EVT-20240315-004412",
  "eventType": "REPAIR_JOB_CREATED",
  "aggregateId": "RO-20240315-00142",
  "payload": {
    "repairJobId": "RJ-001",
    "complaint": "Grinding noise when braking",
    "source": "CUSTOMER_CONCERN",
    "technicianId": "TC-004"
  },
  "actorId": "USER-advisor-007",
  "shopId": "SL-001",
  "at": "2024-03-15T08:30:00Z"
}
```

**Use Cases for Event Log:**
- Audit trail for warranty disputes
- Replay graph to any past state
- Training data for ML model improvement
- Compliance reporting

---

# PART III — LLM-POWERED AGENTS

---

## 7. Agent Architecture

All agents share a common runtime:

```
[User Action / System Event]
        ↓
[Context Assembler] ← Predii Knowledge Graph
        ↓
[Prompt Builder] ← Agent persona + task template
        ↓
[LLM] (Claude claude-sonnet-4-6 / claude-opus-4-6)
        ↓
[Output Parser] → structured JSON or free text
        ↓
[Action Executor] → graph write, SMS send, RO update, notification
        ↓
[Feedback Loop] → outcome stored in graph for model improvement
```

### 7.1 Context Window Budget

Each agent call assembles a PKG context object. Budget targets:

| Context Component | Max Tokens |
|---|---|
| System prompt (agent persona + rules) | 800 |
| Shop config (laborRate, preferences) | 200 |
| Vehicle + Customer summary | 400 |
| Repair jobs (3C, parts, labor) | 1200 |
| Open TSBs + OMS | 600 |
| Technician profile | 300 |
| Similar historical RJs (RAG top-3) | 900 |
| AI insights active | 300 |
| User message / trigger | 400 |
| **Total** | **~5,100** |

---

## 8. Agent Catalog

### 8.1 Service Advisor Agent

**Role:** Primary AI assistant for service advisors. Context-aware across the full RO lifecycle.

**Capabilities:**
- Draft complaint, cause, correction fields from natural language
- Explain repair line items to customers in plain English
- Generate customer-facing repair authorization messages
- Answer advisor questions about the current RO using graph context
- Flag risks (open TSBs, tech mismatch, rebate nudge)

**Trigger:** Any advisor interaction with an active RO

**System Prompt Skeleton:**
```
You are an expert automotive service advisor assistant for {shopName}.
You have full context of the current repair order, vehicle history,
and customer profile. Be concise, professional, and helpful.
Current vehicle: {ymme} with {mileage} miles.
Customer: {customerSegment} customer, {lifetimeVisits} visits, avg ticket ${avgTicketSize}.
Open TSBs: {tsbSummary}
Active insights: {insightSummary}
```

**Sample Interaction:**
```
Advisor: "Customer says the car vibrates at highway speed"
Agent:   "Based on 2021 Honda Civic history in our system (34 similar complaints):
          Top causes:
          1. Tire balance (62% of cases) — check all 4 tires first
          2. Wheel bearing front (18%) — more likely if vibration increases with speed
          3. CV axle imbalance (11%)

          There's also an open TSB 21-089 for driveshaft vibration on 2020-2022 Civics.
          Want me to add a balance + bearing check line to the DVI?"
```

---

### 8.2 Diagnostic Agent (3C Composer)

**Role:** AI-assisted complaint → cause → correction narrative generation.

**Capabilities:**
- Accept symptom description and produce a professional 3C draft
- Pull ranked causes from historical graph matches on same YMME
- Suggest correction language that matches shop's style (learned from past ROs)
- Attach relevant TSBs and labor codes to the correction

**Input:**
```json
{
  "vehicleId": "VH-1HGBH41JXMN109186",
  "rawComplaint": "makes grinding noise when I brake slow",
  "dtcCodes": [],
  "technicianNotes": "front pads metal on metal, rotors scored"
}
```

**Output:**
```json
{
  "complaint": "Customer states vehicle produces a grinding noise when braking at low speeds.",
  "cause": "Inspection revealed front disc brake pad sets worn to metal-to-metal contact. Front rotors show scoring on friction surface. Minimum thickness not met.",
  "correction": "Replaced front disc brake pad sets (both sides) with ATE OE-quality pads. Resurfaced front rotors within spec. Torqued caliper bolts to 44 ft-lbs. Road tested — grinding noise resolved. Brake pedal firm.",
  "laborCodes": ["BRK-DISC-FRONT-RR"],
  "ptnIds": ["PTN-5678", "PTN-5702"],
  "confidence": 0.96
}
```

---

### 8.3 Parts Intelligence Agent

**Role:** Optimize part selection for margin, fitment, rebate progress, and spiff eligibility.

**Capabilities:**
- Compare same PTN across all connected suppliers in real time
- Recommend brand/supplier based on rebate gap and spiff programs
- Flag fitment issues before ordering
- Explain margin impact of each option
- Alert when a part is on a pattern-failure watch list

**Sample Output (Advisor UI Panel):**

```
PTN: Disc Brake Pad Set — 2021 Honda Civic EX 1.5T

Supplier Options:
┌─────────────────────────────────────────────────────────────────────┐
│  Worldpac — ATE OE          $48.50 cost  $89.99 price  46% margin  │
│  ★ RECOMMENDED: $5 tech spiff + $3.20 toward Q1 rebate ($180 gap)  │
├─────────────────────────────────────────────────────────────────────┤
│  O'Reilly — Raybestos       $39.20 cost  $74.99 price  48% margin  │
│  No active spiff. No rebate program.                                │
├─────────────────────────────────────────────────────────────────────┤
│  PartsTech — ACDelco         $42.00 cost  $79.99 price  47% margin  │
│  No active spiff. Category rebate active (low volume).             │
└─────────────────────────────────────────────────────────────────────┘

⚠ Pattern alert: Raybestos PTN-5678 on 2019-2021 Civic has 5.1% comeback rate
  in network data (last 90 days). Consider ATE or OEM.
```

---

### 8.4 Customer Communication Agent

**Role:** Drafts all customer-facing communications — SMS, email, repair authorization, service reminders — using RO context.

**Capabilities:**
- Status update SMS when RO stage changes
- Estimate authorization message (itemized, plain English)
- Vehicle health summary after DVI
- Post-service follow-up + review request
- Overdue service reminder (predictive)
- Decline follow-up (30-day reminder on declined DVI items)

**SMS Templates (LLM-Drafted, Graph-Grounded):**

*Estimate ready:*
```
Hi Sarah! Your 2021 Honda Civic is ready for your approval.

We found:
✓ Front brakes: worn to metal — IMMEDIATE ($312)
• Air filter: dirty — recommend ($38)
• Rear brakes: 30% life — monitor

Total if all approved: $350
Reply YES to approve all, or call us at (650) 555-0100 to discuss.
— Peninsula Precision Auto
```

*Service reminder:*
```
Hi Sarah — it's been 5 months since your last visit.
Based on your driving, your Honda Civic is likely due for an oil change
around 65,000 miles (you're at ~64,800 now).

Book online: wrenchiq.ai/book
— Peninsula Precision Auto
```

---

### 8.5 Technician Assignment Agent

**Role:** Recommend optimal technician for each repair job based on expertise graph.

**Input:**
```json
{
  "repairJobId": "RJ-001",
  "vehicleOrigin": "GERMAN",
  "laborCategory": "ELECTRICAL",
  "estimatedHours": 3.5,
  "shopId": "SL-001"
}
```

**Graph Query:**
```cypher
MATCH (tc:Technician {shopId: $shopId, available: true})
WHERE tc.vehicleOriginExpertise[$origin].roCount > 5
RETURN tc.id, tc.name,
       tc.vehicleOriginExpertise[$origin].avgEfficiency as originEff,
       tc.laborCategoryExpertise[$category].avgEfficiency as catEff,
       tc.currentBayLoad as load
ORDER BY (originEff + catEff) / 2 DESC, load ASC
LIMIT 3
```

**Output:**
```
Recommended for: 2019 BMW 5-Series — Electrical (3.5 hr)

1. James Park (TC-002)  — German score: 8.9/10, Electrical: 7.8/10  [Bay 3, 0.5hr remaining]
2. Marco Rivera (TC-004) — German score: 6.2/10, Electrical: 8.1/10  [Bay 1, available]
3. Diana Chen (TC-006)  — German score: 7.1/10, Electrical: 6.4/10  [Bay 5, 2hr remaining]

Note: James Park is the strongest match. Diana Chen's bay frees up in 2 hours
if you want to wait for her.
```

---

### 8.6 Predictive Maintenance Agent

**Role:** Generate proactive service recommendations for every vehicle in the shop's customer base.

**Inputs from PKG:**
- Last service date + mileage
- OEM maintenance schedule for the vehicle's YMME
- Average monthly mileage (calculated from visit history)
- Declined inspection items
- Open TSBs

**Output (per vehicle):**
```json
{
  "customerId": "CX-00892",
  "vehicleId": "VH-1HGBH41JXMN109186",
  "recommendations": [
    {
      "priority": 1,
      "type": "OEM_SCHEDULE",
      "description": "60,000 mile service due",
      "dueAt": "2024-09-15",
      "dueMileage": 65000,
      "estimatedValue": 535.00,
      "omsId": "OMS-Honda-2021-Civic-60k"
    },
    {
      "priority": 2,
      "type": "DECLINED_DVI",
      "description": "Rear brake pads at 30% — likely due by next visit",
      "estimatedValue": 220.00,
      "inspectionItemId": "II-007"
    },
    {
      "priority": 3,
      "type": "TSB",
      "description": "Open Honda TSB 21-064 fuel pump recall — customer not yet notified",
      "estimatedValue": 0.00,
      "tsbId": "TSB-Honda-2021-Civic-fuel-pump"
    }
  ],
  "totalOpportunityValue": 755.00,
  "recommendedOutreachDate": "2024-08-15",
  "suggestedMessage": "..."
}
```

---

### 8.7 Shop Analytics Agent

**Role:** Answer natural language questions about shop performance using the aggregate graph.

**Capabilities:**
- Revenue trends, tech performance, parts margin analysis
- Rebate pipeline status
- Customer retention and churn analysis
- YMME mix analysis
- TSB capture rate

**Sample Q&A:**

```
Owner: "Which technician has the best labor efficiency this month?"
Agent:  "James Park leads this month at 1.24x flat-rate efficiency,
         generating $8,420 in labor revenue on 43 hours clocked.
         He's particularly strong on German vehicles (1.31x).

         Marco Rivera is close at 1.18x, but has been slower on
         the two BMW jobs this week — worth monitoring."

Owner: "How close are we to the Worldpac Q1 rebate?"
Agent:  "You're $180 from the $5,000 threshold. At your current pace
         (averaging $820/week from Worldpac), you'll cross it in 5 days.

         Tip: Three pending ROs this week use brake parts — switching
         them to Worldpac would get you there today."

Owner: "Which repairs have the highest comeback rate?"
Agent:  "In the last 90 days:
         1. PTN: Oxygen Sensor — 6.2% comeback (11 installs, 2 comebacks).
            Brand: Bosch. Consider OEM Honda.
         2. PTN: Wheel Speed Sensor — 4.8% comeback (21 installs, 1 comeback).
         3. PTN: Mass Air Flow Sensor — 3.9% (26 installs, 1 comeback)."
```

---

### 8.8 Quality Control Agent

**Role:** Predict comeback risk before an RO is closed. Flag quality issues proactively.

**Risk Factors (weighted):**
| Factor | Weight |
|--------|--------|
| Part is on pattern-failure watch list | 0.35 |
| Technician efficiency < 0.80 on this category | 0.20 |
| DTC not fully addressed in 3C | 0.15 |
| Missing test drive confirmation | 0.15 |
| Incomplete correction field | 0.10 |
| Customer complaint partially addressed | 0.05 |

**Output:**
```json
{
  "roId": "RO-20240315-00142",
  "comebackRiskScore": 0.12,
  "riskLevel": "LOW",
  "flags": [],
  "clearanceStatus": "APPROVED_FOR_CLOSE"
}
```

High-risk example:
```json
{
  "roId": "RO-20240318-00157",
  "comebackRiskScore": 0.68,
  "riskLevel": "HIGH",
  "flags": [
    "Part PTN-oxygen-sensor has 6.2% comeback rate — verify brand is OEM or Denso",
    "Correction field mentions no test drive — require confirmation before close",
    "DTC P0136 documented but correction does not mention clearing codes"
  ],
  "clearanceStatus": "HOLD_FOR_REVIEW"
}
```

---

### 8.9 Warranty & TSB Agent

**Role:** Ensure every eligible TSB and recall is surfaced, captured on the RO, and properly documented for OEM reimbursement.

**Capabilities:**
- Match vehicle VIN to open TSBs and recalls at RO intake
- Track OEM warranty reimbursement eligibility per repair job
- Generate TSB claim documentation
- Alert when warranty claim deadline is approaching

---

### 8.10 Revenue Intelligence Agent

**Role:** Surface revenue optimization opportunities to the shop owner and advisor in real time.

**Revenue Levers Monitored:**
| Lever | Insight Example |
|-------|----------------|
| Declined DVI items follow-up | "22 open declined items totaling $8,400. 6 are 60+ days old." |
| Rebate capture | "Switching to Worldpac for 3 pending ROs adds $180 toward Q1 rebate." |
| OMS upsell | "4 vehicles in shop are overdue for 30k/60k service — mention at write-up." |
| Labor efficiency gap | "Marco's ELR is $178 vs shop target $195. Review his last 5 brake jobs." |
| Tech spiff unclaimed | "ATE spiff program expires in 4 days. 6 eligible brake jobs this week." |
| Parts margin alert | "Parts margin dropped to 38% this week vs 46% target. Top culprit: 3 jobs using dealer-priced OEM parts." |

---

## 9. Agent Orchestration

Agents operate in two modes:

### 9.1 Reactive Mode (Event-Driven)
Triggered by RO lifecycle events:
```
RO created → Predictive Maintenance Agent (check OMS, TSBs)
DVI complete → Parts Intelligence Agent (pre-fill parts list)
Estimate sent → Customer Communication Agent (draft SMS)
RO closing → Quality Control Agent (comeback risk check)
RO closed → Revenue Intelligence Agent (update shop metrics)
```

### 9.2 Proactive Mode (Scheduled)
Scheduled graph scans:
```
Daily 7am  → Predictive Maintenance Agent (next 30 days vehicle outreach list)
Daily 8am  → Revenue Intelligence Agent (rebate gap alert if < $500 to threshold)
Weekly Mon → Shop Analytics Agent (weekly performance summary to owner)
Monthly 1st → Churn Detection (customers 45+ days overdue)
```

---

## 10. Agent Feedback Loop

Every agent action is tracked for outcome quality. The graph records:

```json
{
  "agentId": "diagnostic-agent",
  "invocationId": "AGT-20240315-0814",
  "roId": "RO-20240315-00142",
  "repairJobId": "RJ-001",
  "suggestedCause": "Worn brake pads — metal on metal",
  "advisorAction": "ACCEPTED",
  "actualCause": "Worn brake pads — metal on metal",
  "match": true,
  "outcomeAt": "2024-03-15T09:00:00Z"
}
```

Acceptance rates and accuracy are tracked per agent, per YMME, and per shop. Models are fine-tuned quarterly on this feedback.

---

## 11. Agent Capability Matrix

| Agent | Reads Graph | Writes Graph | Sends Message | Blocks Action |
|-------|-------------|--------------|---------------|---------------|
| Service Advisor | Yes | No | No | No |
| Diagnostic (3C) | Yes | Yes (drafts) | No | No |
| Parts Intelligence | Yes | Yes (suggestions) | No | No |
| Customer Communication | Yes | Yes (log) | Yes | No |
| Tech Assignment | Yes | Yes (recommendation) | No | No |
| Predictive Maintenance | Yes | Yes (predicted nodes) | Via scheduler | No |
| Shop Analytics | Yes | No | No | No |
| Quality Control | Yes | Yes (flags) | No | Yes (can hold RO) |
| Warranty/TSB | Yes | Yes (TSB links) | No | No |
| Revenue Intelligence | Yes | No | Yes (owner alerts) | No |

---

## 12. Implementation Phases

| Phase | Agents Delivered |
|-------|-----------------|
| **Phase 1** | Service Advisor Agent (basic Q&A) + Diagnostic Agent (3C drafts) |
| **Phase 2** | Parts Intelligence Agent + Customer Communication Agent |
| **Phase 3** | Tech Assignment Agent + Quality Control Agent |
| **Phase 4** | Predictive Maintenance Agent + Revenue Intelligence Agent |
| **Phase 5** | Shop Analytics Agent + Warranty/TSB Agent |
| **Phase 6** | Multi-agent orchestration + proactive scheduled runs |

---

## 13. Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Graph Database | Neo4j AuraDB |
| Vector Store | pgvector / Weaviate |
| Event Store | MongoDB |
| Cache | Redis |
| NLP / Normalization | Predii NLP API (fine-tuned transformer) |
| LLM | Claude claude-sonnet-4-6 (default) / claude-opus-4-6 (complex tasks) |
| Agent Runtime | Anthropic Agent SDK |
| Embedding | text-embedding-3-large (OpenAI) or Voyage-3 (Anthropic) |
| API Layer | Node.js / Express (REST + WebSocket) |
| SMS/Email | Twilio |

---

# PART IV — AI SERVICE ADVISOR KPI CONFIGURATION

---

## 14. Overview: Configurable KPI Framework

The AI Service Advisor's behavior, recommendations, and alerts are governed by a set of shop-configurable KPIs. Each KPI has:

- A **target value** set by the shop owner or manager
- A **threshold** that triggers an AI alert or behavioral change
- A **data source** in the Predii Knowledge Graph
- A set of **agent behaviors** that activate when the target is met, missed, or at risk

This allows the AI Service Advisor to behave differently at a $150/hr shop vs a $225/hr shop, or a high-volume maintenance shop vs a European specialty shop.

---

## 15. KPI Configuration Schema

```json
{
  "shopId": "SL-001",
  "kpiConfig": {
    "laborRate": {
      "target": 195.00,
      "floor": 175.00,
      "currency": "USD"
    },
    "effectiveLaborRate": {
      "target": 190.00,
      "alertBelowPercent": 10,
      "trackingWindow": "30d"
    },
    "avgTicketSize": {
      "target": 550.00,
      "alertBelowPercent": 15,
      "trackingWindow": "30d"
    },
    "partsMargin": {
      "target": 0.46,
      "floor": 0.38,
      "alertBelowPercent": 5,
      "trackingWindow": "7d"
    },
    "csiScore": {
      "target": 4.7,
      "floor": 4.2,
      "scale": 5.0,
      "source": "google_reviews + internal_survey"
    },
    "comebackRate": {
      "target": 0.02,
      "ceiling": 0.05,
      "trackingWindow": "90d"
    },
    "dvApprovalRate": {
      "target": 0.65,
      "floor": 0.45,
      "trackingWindow": "30d"
    },
    "tsbCaptureRate": {
      "target": 0.90,
      "floor": 0.70,
      "trackingWindow": "30d"
    },
    "techEfficiency": {
      "target": 1.05,
      "floor": 0.90,
      "trackingWindow": "30d"
    },
    "customerRetention90d": {
      "target": 0.72,
      "floor": 0.60
    },
    "rebateCaptureEfficiency": {
      "target": 0.85,
      "description": "% of eligible rebate dollars actually earned"
    },
    "spiffCaptureRate": {
      "target": 0.80,
      "description": "% of eligible spiff units claimed before expiry"
    }
  }
}
```

---

## 16. KPI Definitions and Agent Behaviors

### 16.1 Effective Labor Rate (ELR)

**Definition:** `Total Labor Revenue / Total Technician Hours Clocked`

**Why it matters:** The spread between posted rate ($195) and ELR ($178) represents lost revenue — comebacks, inefficient techs, discounting, or warranty work diluting billable time.

**KPI Config:**
```json
"effectiveLaborRate": {
  "target": 190.00,
  "alertBelowPercent": 10,
  "trackingWindow": "30d"
}
```

**Agent Behaviors Tied to ELR:**

| Condition | Agent | Action |
|-----------|-------|--------|
| ELR > target | Revenue Intelligence | None — positive signal |
| ELR 5–10% below target | Revenue Intelligence | Weekly alert to owner: "ELR is $182 vs $190 target" |
| ELR >10% below target | Revenue Intelligence | Daily alert + Tech Assignment Agent flags inefficient techs |
| Per-tech ELR below floor | Tech Assignment | Deranks tech for labor-intensive jobs |
| ELR drop on specific YMME | Diagnostic Agent | Flags if certain vehicle type is systematically over-clocking time |

---

### 16.2 Average Repair Order Ticket Size

**Definition:** `Total Revenue / Number of Closed ROs` (rolling window)

**KPI Config:**
```json
"avgTicketSize": {
  "target": 550.00,
  "alertBelowPercent": 15,
  "trackingWindow": "30d"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Ticket forming below $350 | Service Advisor | Surfaces open DVI items + OMS jobs: "Add these to this RO?" |
| Ticket at write-up below 60% of target | Predictive Maintenance | Shows "Today's upsell opportunities" panel |
| Monthly avg below target | Revenue Intelligence | "Avg ticket is $468 vs $550 target. Top 3 missed upsells this month: air filters ($38), cabin filters ($42), wiper blades ($28)" |

---

### 16.3 Parts Margin

**Definition:** `(Price - Cost) / Price` averaged across all parts lines in a window

**KPI Config:**
```json
"partsMargin": {
  "target": 0.46,
  "floor": 0.38,
  "alertBelowPercent": 5,
  "trackingWindow": "7d"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Part margin < floor on single line | Parts Intelligence | Real-time warning on parts screen: "Margin on this part is 31% — consider alternative" |
| Weekly margin below target | Revenue Intelligence | Alert to owner with top 5 margin-draining parts |
| Pattern of low-margin on specific PTN | Parts Intelligence | Proactively suggests higher-margin brand on next occurrence |
| Margin below target AND rebate near threshold | Parts Intelligence | "Switch to Worldpac — higher margin AND closes Q1 rebate gap" |

---

### 16.4 DVI Approval Rate

**Definition:** `Approved DVI Line Items / Total Presented DVI Line Items`

**Why it matters:** The approval rate is the primary measure of the advisor's ability to communicate vehicle health value. Low rates indicate price objections, poor communication, or inspection items not being surfaced.

**KPI Config:**
```json
"dvApprovalRate": {
  "target": 0.65,
  "floor": 0.45,
  "trackingWindow": "30d"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Single DVI item declined | Customer Communication | Schedules 30-day follow-up reminder |
| Customer in shop declines >2 items | Service Advisor | Suggests: "Here's a customer-friendly way to explain the rear brake concern..." |
| Advisor DVI approval rate < floor | Shop Analytics | Flags to owner: "Advisor Mike's approval rate is 38% vs 65% target" |
| Declined item + safety flag | Customer Communication | Sends safety-focused follow-up SMS after visit |

---

### 16.5 Technician Efficiency

**Definition:** `Flat-Rate Hours Billed / Actual Hours Clocked` (per tech, per category, per YMME)

**KPI Config:**
```json
"techEfficiency": {
  "target": 1.05,
  "floor": 0.90,
  "trackingWindow": "30d"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Tech efficiency > 1.15 | Shop Analytics | Positive recognition flag; flag tech for premium job routing |
| Tech below 0.90 for 2+ weeks | Tech Assignment | Deranks for complex jobs; suggests re-training flag |
| Tech under-efficient on specific origin | Tech Assignment | "Marco is 0.82x on German vehicles — reassign BMW jobs to James" |
| New tech ramp pattern | Shop Analytics | Tracks week-over-week improvement curve vs benchmark |

---

### 16.6 Customer Satisfaction (CSI) Score

**Definition:** Composite of Google review score, post-visit survey NPS, and response rate

**KPI Config:**
```json
"csiScore": {
  "target": 4.7,
  "floor": 4.2,
  "scale": 5.0,
  "source": "google_reviews + internal_survey"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| RO closed | Customer Communication | Sends post-visit review request (timing: 2 hours after pickup) |
| New 1–3 star review | Service Advisor | Flags to owner immediately with RO context for recovery |
| CSI trending below floor | Shop Analytics | Weekly analysis: "CSI dropped to 4.1. Last 5 low reviews mention wait times." |
| Repeat customer with no review | Customer Communication | Re-sends review request after 3rd visit |

---

### 16.7 Comeback Rate

**Definition:** `ROs flagged as comebacks / Total Closed ROs` (rolling 90 days)

**KPI Config:**
```json
"comebackRate": {
  "target": 0.02,
  "ceiling": 0.05,
  "trackingWindow": "90d"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Comeback RO opened | Quality Control | Auto-links to original RO; surfaces original 3C for comparison |
| Comeback attributed to part | Parts Intelligence | Flags that PTN + supplier combination for watch list |
| Comeback attributed to tech | Tech Assignment | Adds negative signal to tech expertise score for that category |
| Shop comeback rate above ceiling | Quality Control | Blocks close on similar ROs pending supervisor review |

---

### 16.8 TSB Capture Rate

**Definition:** `Repair Jobs linked to a matching TSB / Total TSB-eligible vehicles that visited`

**KPI Config:**
```json
"tsbCaptureRate": {
  "target": 0.90,
  "floor": 0.70,
  "trackingWindow": "30d"
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Vehicle with open TSB enters shop | Service Advisor | Surfaces TSB at RO write-up: "Open TSB 21-064 matches this vehicle" |
| TSB-eligible visit missed | Warranty/TSB Agent | Sends recovery: "Vehicle VH-xxx was in last week — TSB 21-064 not addressed" |
| TSB capture rate below floor | Shop Analytics | Weekly report: "You captured 63% of eligible TSBs. Top missed: Honda TSB 21-064 (7 misses)" |

---

### 16.9 Customer Retention (90-Day)

**Definition:** `Customers who returned within 90 days of expected next service date / Total due`

**KPI Config:**
```json
"customerRetention90d": {
  "target": 0.72,
  "floor": 0.60
}
```

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| Customer 30 days past due | Predictive Maintenance | Queues outreach: "Sarah Chen's Civic is due for oil change — send reminder?" |
| Customer 60 days past due | Customer Communication | Sends personalized SMS with service reminder |
| Customer 90+ days past due | Revenue Intelligence | Marks as churn risk; escalates to owner if high LTV |
| Retention trending below floor | Shop Analytics | Monthly cohort analysis: "Retention dropped to 57% for customers acquired last year" |

---

### 16.10 Rebate and Spiff Capture Efficiency

**Definition:**
- Rebate: `Actual Rebate Earned / Maximum Eligible Rebate` (per program period)
- Spiff: `Spiff Units Claimed Before Expiry / Total Eligible Units`

**Agent Behaviors:**

| Condition | Agent | Action |
|-----------|-------|--------|
| >80% to rebate threshold | Parts Intelligence | Real-time nudge on every parts screen: "You're $180 from Q1 rebate" |
| Rebate period ending in 7 days | Revenue Intelligence | Daily alert to advisor and owner |
| Spiff expiring in 3 days | Revenue Intelligence | Alert to technician: "ATE spiff earns you $5/unit — 4 brake jobs this week qualify" |
| Program ends with unclaimed units | Shop Analytics | Post-period report: "Missed $85 in ATE spiffs this quarter" |

---

## 17. KPI Dashboard Configuration (Shop Admin UI)

Each KPI is configurable from the Shop Admin screen with:

```
┌─────────────────────────────────────────────────────┐
│ KPI: Effective Labor Rate                           │
│                                                     │
│ Target:       [$ 190.00  ]  ← editable             │
│ Alert below:  [ 10    ]%                            │
│ Window:       [30d ▼]                               │
│                                                     │
│ Current (30d): $184.20  ▼ 3.0% below target        │
│ Trend:         ↓ declining (was $188 last month)    │
│                                                     │
│ Agent actions when below target:                    │
│   ☑ Alert owner weekly                             │
│   ☑ Flag inefficient technicians                   │
│   ☑ Surface in Revenue Intelligence panel          │
│   ☐ Block RO close (do not enable)                 │
└─────────────────────────────────────────────────────┘
```

---

## 18. KPI → Agent Behavior Wiring Map

```
KPI                      → Primary Agent       → Secondary Agent
──────────────────────────────────────────────────────────────────
Effective Labor Rate     → Revenue Intelligence → Tech Assignment
Avg Ticket Size          → Service Advisor      → Predictive Maintenance
Parts Margin             → Parts Intelligence   → Revenue Intelligence
DVI Approval Rate        → Service Advisor      → Customer Communication
Tech Efficiency          → Tech Assignment      → Shop Analytics
CSI Score                → Customer Communication → Service Advisor
Comeback Rate            → Quality Control      → Parts Intelligence
TSB Capture Rate         → Service Advisor      → Warranty/TSB Agent
Customer Retention 90d   → Predictive Maintenance → Customer Communication
Rebate Capture           → Parts Intelligence   → Revenue Intelligence
Spiff Capture            → Revenue Intelligence → Tech Assignment
```

---

## 19. KPI Benchmark Data (Industry Averages)

Used as defaults when a shop has not configured custom targets:

| KPI | Independent Shop Avg | High-Performing Shop | Corporate Group Avg |
|-----|---------------------|---------------------|---------------------|
| Effective Labor Rate | $165–$185 | $195–$220 | $155–$175 |
| Avg Ticket Size | $380–$450 | $550–$700 | $320–$420 |
| Parts Margin | 40–44% | 46–52% | 38–43% |
| DVI Approval Rate | 48–55% | 65–75% | 45–52% |
| Tech Efficiency | 0.95–1.05 | 1.10–1.25 | 0.92–1.02 |
| CSI Score | 4.3–4.5 | 4.7–4.9 | 4.2–4.5 |
| Comeback Rate | 3–5% | <2% | 4–6% |
| TSB Capture Rate | 55–65% | 85–92% | 60–70% |
| Customer Retention 90d | 55–62% | 70–78% | 50–58% |

---

## 20. YMM → VCdb ID Resolution (Local Normalizer)

**Purpose:** When source repair order data carries year/make/model text (but no VIN), resolve to canonical AutoCare VCdb IDs to enable cross-shop, cross-source vehicle comparisons.

**Implementation:** `scripts/lib/vehicleNormalizer.js`
**VCdb snapshot:** AutoCare NA LDPS 20260226 — `/opt/predii/external-resources/rawdata/AutoCare_VCdb_NA_LDPS_enUS_ASCII_Current/`

### 20.1 Tables Used

| Table | Rows | Purpose |
|-------|------|---------|
| Make.txt | ~431 | MakeID → MakeName |
| Model.txt | ~17,880 | ModelID → ModelName |
| BaseVehicle.txt | ~81,193 | (Year, MakeID, ModelID) → BaseVehicleID |
| Vehicle.txt | ~181,496 | BaseVehicleID + SubModel → VehicleID |
| EngineBase.txt | ~2,100 | EngineBaseID → Liter, Cylinders, BlockType |
| EngineConfig.txt | ~17,000 | EngineConfigID → EngineBaseID |
| VehicleToEngineConfig.txt | ~284,537 | VehicleID → EngineConfigID[] |

All tables loaded in-memory at script startup (~80 MB). No MongoDB dependency for normalization.

### 20.2 Matching Pipeline

```
Input: { year, make, model }

Make resolution (priority order):
  1. MAKE_ALIASES table   (e.g. "CHEVY" → "Chevrolet", "VW" → "Volkswagen")
  2. Exact lowercase match against VCdb MakeName
  3. Token-overlap F1 ≥ 0.50  (fuzzy fallback)

Model resolution (within resolved make only):
  1. Exact lowercase match
  2. Token-overlap F1 ≥ 0.45  (fuzzy fallback with prefix bonus)

BaseVehicle lookup:
  - Key: ${year}_${makeID}_${modelID}  →  BaseVehicleID (unique per YMM combination)

Vehicle IDs:
  - All VehicleIDs sharing the BaseVehicleID (one per submodel/trim)

Engine configs (source has no engine field):
  - VehicleID → EngineConfigID[] → EngineBaseID → { liter, cylinders, block_type }
  - Returns possible_engine_configs[] — all engine options for the resolved vehicle
```

### 20.3 Output Schema (`vehicle.vcdb`)

```json
{
  "input": { "year": 2019, "make": "LINCOLN", "model": "NAUTILUS" },
  "base_vehicle_id": 78432,
  "vehicle_ids": [181204, 181205, 181206],
  "normalized_make": "Lincoln",
  "normalized_model": "Nautilus",
  "match_confidence": 0.95,
  "match_method": "exact+exact",
  "possible_engine_configs": [
    { "engine_base_id": 1201, "liter": 2.0, "cylinders": 4, "block_type": "L" },
    { "engine_base_id": 1202, "liter": 2.7, "cylinders": 6, "block_type": "V" }
  ],
  "vcdb_date": "20260226"
}
```

### 20.4 match_method Enum

| Value | Meaning |
|-------|---------|
| `alias+exact` | Make via alias table, Model exact match |
| `alias+token_fuzzy` | Make via alias, Model via token overlap |
| `exact+exact` | Both exact matches |
| `exact+token_fuzzy` | Make exact, Model via token overlap |
| `token_fuzzy+exact` | Make via token overlap, Model exact |
| `token_fuzzy+token_fuzzy` | Both via token overlap |
| `no_make_match+*` | Make could not be resolved |
| `*+no_model_match` | Model could not be resolved (no BaseVehicleID) |

### 20.5 Future Upgrade Path

```
// TODO(predii-api): Replace local vehicleNormalizer with:
//   POST /v1/normalize/ymm { year, make, model }
//   Response: { base_vehicle_id, vehicle_ids, normalized_make, normalized_model,
//               match_confidence, possible_engine_configs }
//   match_method sentinel changes from 'exact+exact' → 'predii_api'
```

---

## 21. Dynamic Cluster Builder

**Purpose:** Learn repair patterns from historical repair orders. Surfaces primary repair jobs and associated parts per vehicle group — enabling proactive recommendations, predictive maintenance, and parts stocking intelligence.

**Implementation:** `scripts/buildClusters.js`
**Source:** `wrenchiq_ro` collection
**Output:** `wrenchiq_clusters` collection

### 21.1 Cluster Types

#### Type A: Vehicle Generation Cluster

Groups ROs with the same make+model within a 4-year bucket (generational cohort).

```
cluster_id  = "vgen:{MAKE}_{MODEL}_{year_bucket_start}"
year_bucket = floor((year - 2) / 4) * 4 + 2
Examples:
  vgen:FORD_F-150_2018     → 2018, 2019, 2020, 2021 F-150s
  vgen:TOYOTA_CAMRY_2022   → 2022, 2023, 2024, 2025 Camrys
```

**Why 4-year buckets?** Most passenger vehicle generations span 4–5 years. Fixed buckets ensure each RO belongs to exactly one cluster (no double-counting).

#### Type B: Engine Similarity Cluster

Groups ROs across makes/models that share the same engine family — enabling cross-make repair pattern discovery.

```
cluster_id  = "eng:{cylinders}cyl_{liter_band}L"
liter_band  = round(liter × 5) / 5   (nearest 0.2L)
Examples:
  eng:8cyl_5.3L  → GM 5.3L V8 (Silverado, Tahoe, Yukon, Suburban)
  eng:4cyl_2.0L  → 2.0L inline-4 across Ford, Mazda, Honda, Toyota
```

One RO may belong to multiple engine clusters when its vehicle has multiple engine options (e.g., Silverado offers both 5.3L and 6.2L V8).

### 21.2 Clustering Algorithm

#### Step 1 — Cluster Key Assignment

Each RO is assigned one or more cluster keys based on its `vehicle.vcdb` field:

```
vehicle_generation key:
  normalized_make  = vehicle.vcdb.normalized_make  (e.g. "Ford")
  normalized_model = vehicle.vcdb.normalized_model (e.g. "F-150")
  year_bucket      = floor((vehicle.year - 2) / 4) * 4 + 2
  key              = "vgen:{MAKE}_{MODEL}_{year_bucket_start}"

engine_similarity keys (one per engine option — vehicle may have multiple):
  for each config in vehicle.vcdb.possible_engine_configs:
    liter_band = Math.round(liter × 5) / 5   // nearest 0.2L
    key        = "eng:{cylinders}cyl_{liter_band}L"
```

An RO with multiple engine options (e.g., Silverado offering 5.3L and 6.2L V8) contributes to two engine_similarity clusters simultaneously.

#### Step 2 — Frequency Counting (per cluster)

For all ROs assigned to a cluster:

```
job_freq[repair_job]  = count of ROs containing that job
part_freq[repair_parts] = count of ROs containing that part
pair_freq[job][part]  = count of ROs containing both job and part
job_pair_freq[A][B]   = count of ROs containing both job A and job B
```

Counting is done via a single pass through the cluster's RO set.

#### Step 3 — Association Rule Mining (Market Basket Analysis)

Two rule sets are computed for each cluster:

**Part Affinity Rules — P(part | job):**

```
support    = pair_freq[job][part] / cluster_ro_count
confidence = pair_freq[job][part] / job_freq[job]
lift       = confidence / (part_freq[part] / cluster_ro_count)
```

Filter: `confidence ≥ 0.20` AND `lift ≥ 1.0`

**Job-to-Job Association Rules — P(job_B | job_A):**

```
support    = job_pair_freq[A][B] / cluster_ro_count
confidence = job_pair_freq[A][B] / job_freq[A]
lift       = confidence / (job_freq[B] / cluster_ro_count)
```

Filter: `confidence ≥ 0.10` AND `lift ≥ 1.0`, sorted by `lift DESC`

#### Step 4 — Data Quality Classification

```
ro_count ≥ 10  → data_quality = "sufficient"   (statistically meaningful)
ro_count 5–9   → data_quality = "limited"       (directionally correct)
ro_count 2–4   → data_quality = "insufficient"  (pattern seeds only)
ro_count < 2   → cluster discarded
```

#### Step 5 — Write to wrenchiq_clusters

One document per cluster key. Full rebuild on each run (TODO: incremental upsert with dirty tracking).

### 21.3 Association Rule Methodology (Market Basket Analysis)

For each cluster, the builder computes two sets of rules:

#### Part Affinity: P(part | job)

```
support    = count(ROs with both job AND part) / cluster_ro_count
confidence = count(ROs with both job AND part) / count(ROs with job)
lift       = confidence / (count(ROs with part) / cluster_ro_count)
```

Minimum thresholds: `confidence ≥ 0.20`, `lift ≥ 1.0`
(Low at 100 ROs — statistically meaningful at >500 ROs per cluster.)

#### Job-to-Job Associations: P(job_B | job_A)

Same formulas applied to pairs of repair jobs co-occurring in the same RO.

### 21.4 TODO — Sophisticated Clustering (Next Phase)

The current Market Basket implementation is a frequency baseline. The following upgrades are planned as RO volume grows:

| TODO | Algorithm | Trigger | Benefit |
|------|-----------|---------|---------|
| `TODO(ml-clustering)` | **k-Means / DBSCAN on repair embeddings** | >1k ROs | Discover latent repair clusters not captured by explicit YMM/engine grouping |
| `TODO(seq-rules)` | **Sequential Pattern Mining (PrefixSpan)** | >500 ROs per cluster | Capture time-ordered patterns: oil change → brake service → tire rotation over 12 months |
| `TODO(mileage-bands)` | **Mileage-bucketed sub-clusters** | Mileage field populated | Separate maintenance-interval patterns (30k / 60k / 90k / 120k) from repair patterns |
| `TODO(graph-embeddings)` | **Node2Vec / GraphSAGE on PKG** | Knowledge Graph live | Learn vehicle-repair-part embeddings from graph topology; enable "similar vehicles" retrieval |
| `TODO(collaborative-filter)` | **Matrix Factorization (ALS)** | >5k ROs | Collaborative filtering across shops: "shops that repaired this model also ordered these parts" |
| `TODO(confidence-intervals)` | **Bootstrap confidence intervals on rules** | >200 ROs per cluster | Replace point-estimate lift/confidence with 95% CI; suppress noisy rules at low N |
| `TODO(realtime)` | **Streaming cluster update (Kafka/Flink)** | Production pipeline | Per-RO incremental update instead of full nightly rebuild |

**Priority order:** mileage-bands → sequential rules → bootstrap CI → graph embeddings → ML clustering → collaborative filtering → realtime

### 21.5 Cluster Document Schema

```json
{
  "cluster_id": "vgen:FORD_F-150_2018",
  "cluster_type": "vehicle_generation",
  "normalized_make": "Ford",
  "normalized_model": "F-150",
  "year_bucket_start": 2018,
  "year_bucket_end": 2021,
  "makes": ["Ford"],
  "ro_count": 8,
  "vehicle_years": [2018, 2019, 2020, 2021],
  "data_quality": "limited",
  "top_repair_jobs": [
    { "repair_job": "Oil & Filter Change",    "count": 6, "frequency": 0.75 },
    { "repair_job": "Tire Rotation",           "count": 4, "frequency": 0.5  },
    { "repair_job": "Multi-Point Inspection",  "count": 3, "frequency": 0.375 }
  ],
  "part_affinity": [
    {
      "repair_job": "Oil & Filter Change",
      "parts": [
        { "repair_parts": "Engine Oil Filter", "co_count": 5, "support": 0.625, "confidence": 0.833, "lift": 1.39 },
        { "repair_parts": "Drain Plug",         "co_count": 4, "support": 0.5,   "confidence": 0.667, "lift": 1.6  }
      ]
    }
  ],
  "association_rules": [
    { "antecedent": "Brake Pad Replacement", "consequent": "Brake Rotor Service",
      "support": 0.25, "confidence": 0.75, "lift": 2.25 }
  ],
  "source_ro_numbers": ["RO-PA-2026-003", "RO-SV-2025-007"],
  "built_at": "2026-03-30T...",
  "vcdb_date": "20260226"
}
```

### 21.6 Data Quality Flags

| Flag | Threshold | Meaning |
|------|-----------|---------|
| `sufficient` | ≥ 10 ROs | Statistically meaningful rules |
| `limited` | 5–9 ROs | Rules directionally correct, low confidence |
| `insufficient` | 2–4 ROs | Pattern seeds only; not for production recommendations |

### 21.7 Planned Consumers

| Consumer | Uses |
|----------|------|
| **Service Advisor Agent** | `top_repair_jobs` → proactive upsell suggestions based on vehicle cluster |
| **Parts Intelligence** | `part_affinity` → stock depth recommendations per cluster |
| **Predictive Maintenance** | `top_repair_jobs.frequency` → "vehicles like yours typically need X at this mileage" |
| **Predii Knowledge Graph** | Cluster nodes + edges as graph seed per rooftop and across chain |

### 21.8 Run Order

```bash
# 1. Import (runs normalizers + VCdb resolution)
node scripts/importRepairOrders.js

# 2. Build clusters (reads wrenchiq_ro, writes wrenchiq_clusters)
node scripts/buildClusters.js
```

### 21.9 Predii API TODO Markers Summary

All local normalizer callsites are tagged `// TODO(predii-api):` for grep-based tracking:

| File | Tag | Current | Future |
|------|-----|---------|--------|
| importRepairOrders.js | `TODO(predii-api)` | `local_merged_parts` matcher | `POST /v1/normalize/part` |
| importRepairOrders.js | `TODO(predii-api)` | `local_keyword` taxonomy | `POST /v1/normalize/repair-job` |
| importRepairOrders.js | `TODO(predii-api)` | `vehicleNormalizer.normalize()` | `POST /v1/normalize/ymm` |
| importRepairOrders.js | `TODO(pkg)` | KG stub `status: 'pending'` | `scripts/buildKnowledgeGraph.js` |
| vehicleNormalizer.js | `TODO(predii-api)` | Full file stub | `POST /v1/normalize/ymm` |
| buildClusters.js | `TODO(incremental)` | Full rebuild | Per-cluster upsert with dirty tracking |
| buildClusters.js | `TODO(scale)` | Low thresholds for demo | Raise `MIN_SUPPORT=0.05` at >1k ROs |

---

## 22. Local Parts Normalization — Token F1 Scoring

**Implementation:** `normalizePart()` in `scripts/importRepairOrders.js`
**Taxonomy:** `resources/merged_parts.txt` — 44,230 canonical part terms (AutoCare PCdb-derived)
**Match rate on demo data:** 76% (296/391 part lines)

### 22.1 Inverted Word Index

At startup, the normalizer builds an in-memory inverted index from the parts taxonomy:

```
merged_parts.txt line examples:
  "Engine Oil Filter"
  "Disc Brake Pad Set"
  "Serpentine Belt"

Index structure:
  word → [entry_idx, entry_idx, ...]

Example:
  "oil"    → [0, 441, 882, ...]   // all entries containing "oil"
  "filter" → [0, 103, 208, ...]   // all entries containing "filter"
  "engine" → [0, 55, 212, ...]    // all entries containing "engine"
```

Lookup time: O(1) per candidate retrieval via Set intersection on word lists.

### 22.2 Token F1 Scoring

For each raw part description, the normalizer:

**Step 1 — Tokenize query**
```
input: "oil filter change"
tokens: ["oil", "filter", "change"]   (lowercase, non-alpha removed, min 2 chars)
```

**Step 2 — Candidate retrieval (inverted index)**
```
For each query token, fetch candidate entry indices.
Union all candidates → deduplicated candidate set.
Skip candidates with 0 shared tokens (exact exclusion).
```

**Step 3 — Score each candidate via Token F1**

```
queryToks     = Set of query tokens
candidateToks = Set of candidate entry tokens

coverage  = |queryToks ∩ candidateToks| / |queryToks|      // recall
precision = |queryToks ∩ candidateToks| / |candidateToks|   // precision
F1        = 2 × (coverage × precision) / (coverage + precision)

Prefix bonus: if any query token (min 3 chars) is a prefix of a candidate token,
              add 0.1 per match (e.g. "cam" matches "camshaft")
```

**Step 4 — Accept or reject**
```
Best candidate F1 ≥ 0.40 → accept, store as repair_parts
Best candidate F1 < 0.40 → no match, repair_parts = null
```

### 22.3 Output Fields

```json
{
  "repair_parts":       "Engine Oil Filter",
  "parts_category":     null,
  "normalizer_score":   0.857,
  "normalizer_method":  "local_merged_parts"
}
```

`normalizer_method` sentinel `"local_merged_parts"` is the grep tag for future Predii API replacement.

### 22.4 Known Limitations & TODO

| Limitation | Example | Fix |
|------------|---------|-----|
| Acronyms with no shared tokens | "LOF" → no match | `TODO(predii-api)`: abbreviation expansion table or API |
| Brand-specific part names | "Motorcraft FL-500S" → low F1 | Supplier SKU normalization layer |
| Multi-word synonyms | "friction material" → "Disc Brake Pad Set" | Bigram/trigram index |
| No category classification | All parts returned flat | PCdb category assignment via Predii API |

---

## 23. Local Labor/Job Normalization — Keyword Taxonomy + Source Fallback

**Implementation:** `normalizeJob()` in `scripts/importRepairOrders.js`
**Match rate on demo data:** 83% (270/326 labor lines)

### 23.1 Two-Stage Pipeline

```
Raw labor description
  ↓
Stage 1: Source Repairs Lookup (exact match against source DB repairs[])
  ↓ (if no match)
Stage 2: Keyword Taxonomy (44-entry regex/keyword table)
  ↓ (if no match)
  repair_job = null, normalizer_method = null
```

### 23.2 Stage 1 — Source Repairs Lookup

The source repair orders collection contains a `repairs[]` array on each document with normalized job names from the originating SMS. If the raw labor description appears (case-insensitive) in any `repairs[].description`, the matched `repairs[].name` is used directly.

```
normalizer_method = "source_repairs"
```

### 23.3 Stage 2 — Keyword Taxonomy (44 entries)

A deterministic keyword table maps common labor shorthand to canonical job names. Matching is case-insensitive substring search, applied in priority order (more specific entries first):

```
Pattern                     → Canonical repair_job
─────────────────────────────────────────────────────────────
"oil" + "filter"            → "Oil & Filter Change"
"brake" + "pad"             → "Brake Pad Replacement"
"tire" + "rotat"            → "Tire Rotation"
"brake" + "rotor"           → "Brake Rotor Replacement"
"align"                     → "Wheel Alignment"
"coolant" / "antifreeze"    → "Coolant Flush"
"transmission" + "fluid"    → "Transmission Fluid Service"
"spark plug"                → "Spark Plug Replacement"
"air filter"                → "Engine Air Filter Replacement"
"cabin filter"              → "Cabin Air Filter Replacement"
"battery"                   → "Battery Replacement"
"belt" + "serpentine"       → "Serpentine Belt Replacement"
"timing belt"               → "Timing Belt Replacement"
"fuel filter"               → "Fuel Filter Replacement"
"wiper"                     → "Wiper Blade Replacement"
"ac" / "a/c" / "refrigerant" → "A/C Service"
... (44 entries total)
```

```
normalizer_method = "local_keyword"
```

### 23.4 Output Fields

```json
{
  "repair_job":          "Brake Pad Replacement",
  "normalizer_method":   "local_keyword"
}
```

### 23.5 TODO — Upgrade Path

```
// TODO(predii-api): Replace normalizeJob() with:
//   POST /v1/normalize/repair-job { description, vehicle_context }
//   Response: { repair_job, labor_op_code, flat_rate_hours, category }
//   normalizer_method sentinel changes: 'local_keyword' → 'predii_api'
```

---

## 24. End-to-End Normalization Flow

The complete pipeline as executed during `importRepairOrders.js`:

```
Source repair_order document
  │
  ├── ro_lines[] (sorted by index field)
  │     │
  │     ├── L-type line (Labor)
  │     │     ├── normalizeJob(description, sourceRepairs)
  │     │     │     ├── Stage 1: source_repairs exact match
  │     │     │     └── Stage 2: 44-entry keyword taxonomy
  │     │     └── → repair_job, normalizer_method
  │     │
  │     └── P-type lines (Parts, attach to preceding L-line)
  │           ├── normalizePart(description, invertedIndex)
  │           │     ├── Tokenize query
  │           │     ├── Inverted index candidate retrieval
  │           │     └── Token F1 scoring (coverage × precision + prefix bonus)
  │           └── → repair_parts, normalizer_score, normalizer_method
  │
  ├── vehicle { year, make, model }
  │     └── normalizeVehicle(year, make, model, vcdb)
  │           ├── resolveMake:  MAKE_ALIASES → exact → tokenF1 ≥ 0.50
  │           ├── resolveModel: exact → tokenF1 ≥ 0.45 (within resolved make)
  │           ├── BaseVehicle lookup: "${year}_${makeID}_${modelID}"
  │           └── → base_vehicle_id, vehicle_ids[], possible_engine_configs[]
  │
  └── knowledge_graph stub
        └── { status: 'pending', nodes: [], edges: [] }
              └── TODO(pkg): replace with buildKnowledgeGraph.js
```

**Collection written:** `wrenchiq.wrenchiq_ro`
**Next step:** `buildClusters.js` reads `wrenchiq_ro`, writes `wrenchiq_clusters`

