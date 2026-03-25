# WrenchIQ-OEM — 3C Story Writer: Demo Data & Integration Specification

**Status:** Active
**Owner:** Predii Engineering / Product
**Last Updated:** 2026-03-23
**Purpose:** Defines the 10 pre-selected demo vehicles (VIN + YMME), real-world NHTSA complaint data, associated TSBs/recalls, DTC context, OEM warranty coverage, agent data source architecture, and smoke tests for validating 3C story generation.

---

## 1. Demo Vehicle Registry

10 vehicles across 5 makes (2 per make). VINs are structurally valid demo identifiers — check digit (position 9) is synthetic.

| # | VIN (Demo) | Year | Make | Model | Trim | Engine | ro_type |
|---|-----------|------|------|-------|------|--------|---------|
| V01 | `1GCPWDED8KZ246810` | 2019 | Chevrolet | Silverado 1500 | LT Trail Boss | 5.3L V8 EcoTec3 (L84) | warranty |
| V02 | `2GNAXUEV4L6135792` | 2020 | Chevrolet | Equinox | LT FWD | 1.5L Turbo I4 (LYX) | warranty |
| V03 | `4T1G11AK3MU357159` | 2021 | Toyota | Camry | XSE FWD | 2.5L I4 (A25B-FKS) | warranty |
| V04 | `JTMN1RFV0KD468260` | 2019 | Toyota | RAV4 | XLE AWD | 2.5L I4 (A25A-FXS) | warranty |
| V05 | `1FTFW1E52LFA579371` | 2020 | Ford | F-150 | XLT SuperCrew | 5.0L Ti-VCT V8 (Coyote) | warranty |
| V06 | `1FM5K8D83KGA680482` | 2019 | Ford | Explorer | XLT FWD | 2.3L EcoBoost I4 | warranty |
| V07 | `5J6RW2H89JL791593` | 2018 | Honda | CR-V | EX-L AWD | 1.5L Turbo I4 (L15B7) | warranty |
| V08 | `1HGCV1F39KA802604` | 2019 | Honda | Accord | Sport Sedan | 1.5L Turbo I4 (L15B7) | warranty |
| V09 | `4S4BSAFC3K3913715` | 2019 | Subaru | Outback | 2.5i Premium AWD | 2.5L Boxer H4 (FB25) | warranty |
| V10 | `JF2SKAFC2LH024826` | 2020 | Subaru | Forester | Sport AWD | 2.5L Boxer H4 (FB25) | warranty |

---

## 2. Vehicle Data Cards

Each card contains: NHTSA complaint (reason for visit), associated TSBs, associated recalls, DTCs identified by technician during 3C, and OEM warranty coverage.

---

### V01 — 2019 Chevrolet Silverado 1500 5.3L V8

**VIN:** `1GCPWDED8KZ246810`
**Mileage at Write-Up:** 38,420 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11308872 (paraphrased for demo)*
> "Engine oil level drops approximately 1 quart every 1,000 miles. No visible external leaks detected. Oil pressure warning light flickered briefly at idle. Check engine light illuminated. Dealer confirmed excessive oil consumption related to Active Fuel Management (AFM) system. Lifter valley area shows signs of oil coking."

**Advisor Shorthand Input:** `oil low 1qt/1k mi, CEL on, oil pressure lite flicker`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **PIP5622E** | Excessive Engine Oil Consumption — AFM/DOD Lifter Collapse | 2020-06 | 2019–2021 Silverado/Sierra 5.3L/6.2L V8 |
| **19-NA-355** | Oil Consumption Diagnostic Procedure — L84/L87 Engines | 2019-11 | 2019 Silverado 1500 5.3L (L84) |
| **PIP5739** | Engine Oil Pressure Low / MIL Illuminated — P0521 | 2021-02 | 2019–2022 GMT1XX Trucks |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(None active for this VIN at time of visit)* | — | — |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0521` | Engine Oil Pressure Sensor/Switch Range/Performance | Active | Identified per TSB PIP5739 |
| `P0014` | Camshaft Position B — Timing Over-Advanced (Bank 1) | Pending | AFM solenoid residual |
| `P0008` | Engine Position System Performance (Bank 1) | Stored | Timing chain slack — per PIP5622E |

#### OEM Warranty Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (38,420 mi, 4 yr 2 mo) |
| TSB Applicability | PIP5622E covered under powertrain; engine teardown authorized |
| Prior Authorization Required | Yes — GM WCC (Warranty Claims Center) approval required before engine disassembly |
| Labor Op Code | **J3205** — Engine Oil Consumption Diagnostic; **J4301** — AFM Lifter Replacement |
| Parts Pre-Auth | Lifter kit PN 12643752, Valley cover gasket PN 12673242 |

---

### V02 — 2020 Chevrolet Equinox 1.5T

**VIN:** `2GNAXUEV4L6135792`
**Mileage at Write-Up:** 24,150 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11389541 (paraphrased for demo)*
> "While driving at approximately 65 mph on the highway, the engine suddenly stalled without warning. Power steering and brakes were lost briefly. Managed to pull over safely. Engine restarted after 2 minutes. No warning lights prior to stall. Fuel level was adequate. Issue has occurred 3 times in 6 months."

**Advisor Shorthand Input:** `engine stall hwy 65mph, no warning, happened 3x, restarts ok`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **PIP5626B** | Engine Stall / Hesitation — Fuel Injector Deposit Buildup | 2021-04 | 2018–2021 Equinox/Terrain 1.5T (LYX) |
| **PIE0956** | Intermittent Engine Stall at Highway Speed — Low Fuel Rail Pressure | 2020-09 | 2018–2020 Equinox 1.5T |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| **20V-419** | Engine Stall — Low-Pressure Fuel Pump Failure | Open — not yet performed on this VIN |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0087` | Fuel Rail/System Pressure Too Low | Stored | Fuel pump failing — per recall 20V-419 |
| `P0171` | System Too Lean (Bank 1) | Stored | Result of low fuel pressure |
| `P0300` | Random/Multiple Cylinder Misfire Detected | Stored | Lean condition during stall event |

#### OEM Warranty Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (24,150 mi, 3 yr 1 mo) |
| Recall Coverage | 20V-419 — no cost to customer, parts supplied by GM |
| Labor Op Code | **K4521** — Low Pressure Fuel Pump Replacement (Recall); **K3102** — Fuel Injector Cleaning |
| Parts | Low-pressure fuel pump PN 42748808 (recall part, shipped from GM PDC) |

---

### V03 — 2021 Toyota Camry 2.5L

**VIN:** `4T1G11AK3MU357159`
**Mileage at Write-Up:** 19,870 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11427603 (paraphrased for demo)*
> "Vehicle hesitates noticeably during acceleration from 20–45 mph. Engine stumbles and surges as if it momentarily loses power. Condition is worse when the engine is cold. Fuel economy has dropped approximately 4 MPG. Check engine light came on and off twice."

**Advisor Shorthand Input:** `hesitation 20-45mph, worse cold, mpg down, CEL on/off`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **T-SB-0088-20** | Engine Hesitation / Surge — Low Pressure Fuel Pump Performance | 2020-08 | 2018–2021 Camry/Avalon 2.5L (A25B) |
| **T-SB-0061-21** | MIL ON — P0087/P1250 — Fuel Pressure Insufficient | 2021-03 | 2021 Camry 2.5L (A25B-FKS) |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| **20V-418** | Low-Pressure Fuel Pump May Fail — Possible Engine Stall | Open — not yet performed |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0087` | Fuel Rail/System Pressure Too Low | Active | Fuel pump recall 20V-418 |
| `P1250` | Fuel Pressure Hold (Fuel Pump Monitor — Toyota specific) | Active | Per TSB T-SB-0061-21 |

#### OEM Warranty Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (19,870 mi, 2 yr 4 mo) |
| Recall Coverage | 20V-418 — no cost, parts shipped from Toyota PDC |
| Toyota WAS Submission | Required — Recall Operation # EF9D |
| Labor Op Code | **EF9D-20** — Low Pressure Fuel Pump Replacement (Recall) |
| Parts | Fuel pump assembly PN 23221-25030 (supersedes 23221-25020) |

---

### V04 — 2019 Toyota RAV4 2.5L AWD

**VIN:** `JTMN1RFV0KD468260`
**Mileage at Write-Up:** 31,540 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11356219 (paraphrased for demo)*
> "Vehicle shakes and idles roughly on cold starts, especially when ambient temperature is below 40°F. Engine vibrates noticeably for 3–5 minutes after start. Check engine light illuminated with misfire codes. Condition has been present since approximately 15,000 miles. Dealer has attempted repair twice without resolution."

**Advisor Shorthand Input:** `rough idle cold start <40F, vibration 3-5 min, CEL misfire codes, 2x prev repair attempt`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **T-SB-0131-19** | Rough Engine Idle / Vibration on Cold Start — Carbon Buildup on Intake Valves | 2019-09 | 2019–2020 RAV4 2.5L (A25A-FXS) |
| **T-SB-0053-20** | MIL ON P0300/P0301–P0304 — Misfire on Cold Start | 2020-05 | 2019–2020 RAV4 2.5L AWD |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(None active for this VIN)* | — | — |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0300` | Random/Multiple Cylinder Misfire Detected | Active | Per TSB T-SB-0131-19 |
| `P0301` | Cylinder 1 Misfire Detected | Active | Cold start carbon — TSB T-SB-0053-20 |
| `P0171` | System Too Lean (Bank 1) | Pending | Secondary lean condition from carbon deposits |

#### OEM Warranty Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (31,540 mi, 4 yr 0 mo) |
| TSB Coverage | T-SB-0131-19 covered — induction cleaning + injector service authorized |
| Prior Authorization | Not required — direct TSB repair authorization |
| Labor Op Code | **1250344** — Intake Valve Carbon Cleaning (GDI); **1251101** — Fuel Injector Service |
| Parts | Top Engine Cleaner (Toyota PN 00289-1EC00), Injector cleaner additive |

---

### V05 — 2020 Ford F-150 5.0L V8

**VIN:** `1FTFW1E52LFA579371`
**Mileage at Write-Up:** 28,760 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11391724 (paraphrased for demo)*
> "Transmission shudders and vibrates noticeably between 30–45 mph under light acceleration. Feels like driving over a rumble strip. Condition is intermittent but has become more frequent over the past 3 months. A technician at another shop told me it may be the transmission fluid. No check engine light."

**Advisor Shorthand Input:** `trans shudder 30-45mph light throttle, no CEL, getting worse`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **19-2346** | 10-Speed Automatic Transmission (10R80) Shudder / Vibration — Fluid Exchange | 2019-10 | 2017–2020 F-150 / Mustang GT 10R80 |
| **SSM 49537** | 10R80 Transmission Shudder Between 25–50 MPH — Torque Converter Clutch | 2020-03 | 2020 F-150 5.0L, 2.7L EcoBoost |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(None active for this VIN)* | — | — |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0741` | Torque Converter Clutch Circuit Performance / Stuck Off | Stored | TCC shudder — per TSB 19-2346 |
| `P07D5` | Transmission Fluid Degraded | Stored | Fluid breakdown — per SSM 49537 |

*(Note: No active MIL codes. Stored codes retrieved via Ford IDS-equivalent scan — tech entered via shorthand after manual scan.)*

#### OEM Warranty Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (28,760 mi, 3 yr 5 mo) |
| TSB Coverage | 19-2346 — transmission fluid exchange covered under powertrain |
| Labor Op Code | **307B08A** — 10R80 Transmission Fluid Exchange per TSB 19-2346 |
| Parts | Motorcraft XT-10-QLVC MERCON ULV (14 qts), Drain plug PN -378758-S100 |

---

### V06 — 2019 Ford Explorer 2.3L EcoBoost

**VIN:** `1FM5K8D83KGA680482`
**Mileage at Write-Up:** 44,100 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11287345 (paraphrased for demo)*
> "Strong exhaust/carbon monoxide odor inside the passenger cabin while driving, especially at highway speeds and when the HVAC is set to recirculate. Passengers experienced headaches, dizziness, and nausea. The smell is most noticeable with the rear windows closed. A carbon monoxide detector placed inside the vehicle measured elevated CO levels."

**Advisor Shorthand Input:** `exhaust fumes in cabin hwy, passengers dizzy/headache, worse windows up`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **19-2130** | Exhaust Odor / Carbon Monoxide in Passenger Compartment | 2019-07 | 2011–2019 Ford Explorer all engines |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| **19S32 / NHTSA 19V-726** | Exhaust Leak into Passenger Compartment — Possible CO Exposure | **Open — Safety Recall — Not Performed** |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| *(No DTCs present)* | Exhaust leak is mechanical — no powertrain fault codes generated | — | — |

*Note: Technician used CO detector (not OBD scan) to confirm exhaust presence. Physical inspection per Recall 19S32 procedure confirmed exhaust leak at rear exhaust manifold-to-pipe junction.*

#### OEM Warranty Coverage
| Coverage | Details |
|---------|---------|
| Recall Coverage | 19S32 — Safety Recall, no cost to customer, **no mileage limit** |
| Ford WUPS Submission | Required — Recall Operation Code **19S32** |
| Labor Op Code | **19S32B** — Exhaust System Repair per Safety Recall |
| Parts | Exhaust manifold gasket PN HB5Z-9450-A, Body seal kit PN LB5Z-7801812-A |
| Customer Notification | Required — CO safety notice to be left with customer upon delivery |

---

### V07 — 2018 Honda CR-V 1.5T AWD

**VIN:** `5J6RW2H89JL791593`
**Mileage at Write-Up:** 29,330 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11264481 (paraphrased for demo)*
> "Strong gasoline odor coming from the HVAC vents, especially on cold mornings. Checked the oil dipstick and the oil level is above the maximum mark — it appears the oil is diluted with gasoline. The oil smells strongly of fuel. Engine sometimes hesitates on cold starts below 35°F. I am concerned about fire risk and engine damage."

**Advisor Shorthand Input:** `gas smell vents, oil above max, smells like fuel, hesitation cold start <35F`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **19-079** | Engine Oil Dilution — Cold Climate Operation | 2019-06 | 2017–2020 CR-V 1.5T (L15B7) — cold-climate states |
| **A19-010** | Oil Level Increasing / Gasoline Odor — L15B Turbo Diagnosis Procedure | 2019-04 | 2017–2019 CR-V, Civic, Accord 1.5T |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(No formal recall issued)* | Honda declined to issue a recall; NHTSA investigation closed | — |

#### OEM Warranty / Special Coverage
| Coverage | Details |
|---------|---------|
| Base Warranty | 3 yr / 36,000 mi B2B — **Expired** (29,330 mi, 5 yr 2 mo) |
| Powertrain Warranty | 5 yr / 60,000 mi — Active (29,330 mi) |
| **Special Policy Extension** | Honda Customer Satisfaction Program **IL7-1911**: Oil dilution — extended warranty to **8 yr / unlimited miles** for affected vehicles in designated cold-climate states (AK, CO, ID, IL, IN, IA, KS, MI, MN, MO, MT, NE, NH, NJ, NY, ND, OH, PA, SD, VT, WI, WY) |
| Customer Pay Fallback | If vehicle is not in a qualifying state, customer pay with goodwill consideration at dealer discretion |
| Honda WarrantyLink Submission | Required — Special Policy code **IL7-1911** |
| Labor Op Code | **6P200-001** — Engine Oil Change + Dilution Inspection; **6N200-005** — PCM Reprogramming per TSB 19-079 |
| Parts | 0W-20 Honda Genuine Motor Oil (5 qts), Oil filter PN 15400-PLM-A01 |

---

### V08 — 2019 Honda Accord 1.5T Sport

**VIN:** `1HGCV1F39KA802604`
**Mileage at Write-Up:** 22,880 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11329877 (paraphrased for demo)*
> "Engine oil level is continuously rising. Dipstick shows oil well above maximum mark. Oil has a distinct gasoline smell. Mileage since last oil change is only 4,200 miles. Also noticing the engine idles roughly and hesitates during acceleration on cold mornings. Very concerned about the long-term engine damage."

**Advisor Shorthand Input:** `oil level rising 4200mi, smells gas, rough idle hesitation cold`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **19-079** | Engine Oil Dilution — Cold Climate Operation | 2019-06 | 2017–2020 Accord 1.5T (L15B7) |
| **A20-003** | Updated PCM Calibration — Fuel Injection Strategy (Cold Start) | 2020-01 | 2018–2020 Accord 1.5T Sport/EX |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(No formal recall issued)* | Same Honda position as CR-V | — |

#### OEM Warranty / Special Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (22,880 mi, 3 yr 8 mo) |
| Special Policy Extension | Honda Customer Satisfaction Program **IL7-1911** (same as CR-V) — 8 yr / unlimited for cold-climate states |
| Labor Op Code | **6P200-001** — Oil Change + Dilution Inspection; **6E501-008** — PCM Reprogramming (A20-003) |
| Parts | 0W-20 Honda Genuine Motor Oil, Oil filter, Drain plug washer |

---

### V09 — 2019 Subaru Outback 2.5L Premium AWD

**VIN:** `4S4BSAFC3K3913715`
**Mileage at Write-Up:** 36,200 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11344292 (paraphrased for demo)*
> "Engine consumes approximately 1 quart of oil every 800–1,000 miles. No visible external leaks, no blue smoke from exhaust under normal driving. Oil level drops from full to below minimum between oil changes. Dealer performed oil consumption test but said consumption was 'within spec.' I disagree and believe this is excessive."

**Advisor Shorthand Input:** `oil consumption 1qt/800mi, no leaks, no smoke, dealer said "within spec" prev visit`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **02-157-20R** | Engine Oil Consumption — Diagnosis and Repair Procedure (FB25/FB20) | 2020-11 | 2015–2020 Outback / Legacy / Forester 2.5L (FB25) |
| **16-216-19R** | Oil Consumption — Piston Ring Land Inspection Procedure | 2019-08 | 2015–2019 Outback 2.5L (FB25) — mileage ≥ 20,000 |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(None active for this VIN)* | — | — |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0011` | Camshaft Position A — Timing Over-Advanced or System Performance (Bank 1) | Stored | VVT solenoid deposit buildup — secondary to oil consumption per TSB 02-157-20R |
| `P0420` | Catalyst System Efficiency Below Threshold (Bank 1) | Stored | Oil burning contaminating catalytic converter |

#### OEM Warranty / Special Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (36,200 mi, 4 yr 3 mo) |
| Special Policy | **Subaru Special Coverage Adjustment WRS-92**: Oil consumption on FB25 engines — extended to 8 yr / 100,000 mi for piston/ring replacement if consumption confirmed > 1 qt/1,200 mi by Subaru-approved test |
| Oil Consumption Test | Required 1,200-mile oil consumption test before parts authorization |
| Prior Authorization | Required — Subaru Technical Assistance required before engine repair |
| Labor Op Code | **12181AA010** — Oil Consumption Test; **12100AJ950** — Engine Short Block Replacement (if consumption confirmed) |
| Parts | Piston ring set PN 12033AA410, Short block assembly (if required) |

---

### V10 — 2020 Subaru Forester 2.5L Sport AWD

**VIN:** `JF2SKAFC2LH024826`
**Mileage at Write-Up:** 18,440 mi
**Arrival Method:** Driven

#### NHTSA Complaint (Reason for Visit)
> *Source: NHTSA ODI Complaint ID 11401836 (paraphrased for demo)*
> "Transmission shudders and vibrates strongly during low-speed acceleration from a stop, particularly between 5–20 mph. Feels like the clutch is slipping or the drivetrain is stuttering. The shudder is most noticeable when the engine is warm. Condition has progressively worsened over 6 months. No check engine light."

**Advisor Shorthand Input:** `trans shudder 5-20mph from stop, worse when warm, progressing, no CEL`

#### TSBs
| TSB Number | Title | Issued | Applies To |
|-----------|-------|--------|------------|
| **16-183-20R** | Lineartronic CVT — Judder / Shudder — Fluid Replacement Procedure | 2020-07 | 2014–2021 Forester / Outback / Crosstrek Lineartronic CVT |
| **02-177-21R** | CVT Shudder — Updated Fluid Formulation and Cooler Line Flush Procedure | 2021-02 | 2019–2021 Forester 2.5L Sport |

#### Recalls
| Campaign | Title | Status |
|---------|-------|--------|
| *(None active for this VIN)* | — | — |

#### DTCs Identified by Technician
| DTC | Description | Status | Source |
|-----|-------------|--------|--------|
| `P0868` | Transmission Fluid Pressure Sensor / Switch A — Low | Stored | CVT fluid degradation — per TSB 16-183-20R |
| `P0700` | Transmission Control System Malfunction (general) | Stored | TCM registering CVT fault — secondary code |

#### OEM Warranty / Special Coverage
| Coverage | Details |
|---------|---------|
| Powertrain Warranty | 5 yr / 60,000 mi — Active (18,440 mi, 2 yr 9 mo) |
| CVT Warranty | **Additional CVT warranty: 10 yr / 100,000 mi** (Subaru extended CVT coverage — all models 2010+) |
| TSB Coverage | 16-183-20R and 02-177-21R covered under CVT warranty |
| Labor Op Code | **31100FJ040** — CVT Fluid Replacement per TSB; **31100FJ050** — Cooler Line Flush |
| Parts | Subaru CVT Fluid HCF-2 PN SOA427V1700 (10 qts), CVT drain plug washer |

---

## 3. Agent Architecture — Data Source Ingestion

Each data source is managed by a dedicated agent that runs asynchronously and contributes structured context to the 3C assembly pipeline.

```
                        ┌──────────────────────────────────┐
                        │        3C Assembly Agent          │
                        │  (orchestrates all sub-agents)    │
                        └──────┬───────────────────┬────────┘
                               │                   │
              ┌────────────────┼───────────────┐   │
              ▼                ▼               ▼   ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  VIN Agent   │  │ NHTSA Agent  │  │ TSB/Recall   │  │  Warranty    │
     │              │  │              │  │    Agent     │  │  Context     │
     │  (always     │  │  (complaint  │  │  (real-time  │  │   Agent      │
     │   first)     │  │   lookup)    │  │   lookup)    │  │              │
     └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
            │                 │                  │                  │
            ▼                 ▼                  ▼                  ▼
     OEM Spec Set      Complaint Text      TSB Documents      Warranty Rules
     YMME Profile      + ODI Numbers       Recall Campaigns   Coverage Status
     Component Names   Ranked by VIN       DTC-to-TSB Map     Labor Op Codes
     Labor Op Codes    complaint match     Campaign Parts      Auth Requirements
            │                 │                  │                  │
            └─────────────────┴──────────────────┴──────────────────┘
                                        │
                                        ▼
                        ┌──────────────────────────────────┐
                        │       DTC Enrichment Agent        │
                        │                                   │
                        │  Input: raw DTC from tech         │
                        │  + VIN spec + TSB context         │
                        │  Output: enriched DTC record      │
                        │  (description, freeze-frame,      │
                        │  diagnostic path, TSB link)       │
                        └──────────────────────────────────┘
                                        │
                                        ▼
                        ┌──────────────────────────────────┐
                        │      Narrative Assembly Agent     │
                        │                                   │
                        │  Builds 3C draft from:            │
                        │  - Concern (NHTSA + advisor note) │
                        │  - Cause (DTCs + voice/shorthand) │
                        │  - Correction (parts + procedure) │
                        │  Runs OEM compliance validation   │
                        └──────────────────────────────────┘
```

### Agent Definitions

#### Agent 1: VIN Intelligence Agent
**Trigger:** RO opened (VIN present)
**Data Sources:**
- NHTSA vPIC API (`vpic.nhtsa.dot.gov/api`) — YMME decode
- Predii OEM Spec Database — component names, specs, labor ops, part numbers by VIN pattern
- Internal DMS — vehicle service history, prior DTCs, prior ROs

**Outputs:**
- `vin_profile`: YMME, engine code, trim, plant, country of origin
- `oem_spec`: component catalog, torque values, fluid specs, OEM part numbers for this exact vehicle
- `service_history`: prior ROs, prior DTCs, mileage history
- `oem_id`: `gm` | `toyota` | `ford` | `honda` | `subaru` | ...

---

#### Agent 2: NHTSA Complaint Intelligence Agent
**Trigger:** RO opened + complaint/concern text available
**Data Sources:**
- NHTSA Complaints API (`api.nhtsa.dot.gov/complaints/complaintsByVehicle`) — queries by make/model/year
- Predii complaint pattern index — semantic similarity matching between advisor shorthand and known complaint patterns

**Outputs:**
- `matched_complaints[]`: top 3 NHTSA complaints ranked by semantic similarity to advisor's intake note
  - `odi_number`: NHTSA complaint ID
  - `complaint_text`: original complaint verbatim
  - `component`: NHTSA component category
  - `similarity_score`: 0–1
- `concern_draft`: expanded Concern field built from advisor shorthand + top complaint match

---

#### Agent 3: TSB & Recall Agent
**Trigger:** VIN decoded + complaint text available
**Data Sources:**
- NHTSA Recalls API (`api.nhtsa.dot.gov/recalls/recallsByVehicle`) — open recalls by YMME
- Predii TSB Index — OEM technical service bulletins indexed by YMME + component + DTC
- OEM Bulletin Feeds: GM TIS, Toyota TIS, Ford OASIS, Honda iN, Subaru STI (aggregated via Predii)

**Outputs:**
- `open_recalls[]`: active campaigns for this VIN — `campaign_number`, `title`, `component`, `remedy`, `status`
- `applicable_tsbs[]`: ranked TSBs for this YMME + complaint combination — `tsb_number`, `title`, `dtcs_referenced[]`, `procedure_summary`
- `recall_routing`: if open recall found → sets `ro_type = warranty`, pre-populates campaign number and parts

---

#### Agent 4: DTC Enrichment Agent
**Trigger:** Tech enters DTC code (shorthand or voice)
**Data Sources:**
- SAE J2012 DTC dictionary — standard code descriptions
- Predii OEM DTC Overlay — OEM-specific descriptions and diagnostic paths by VIN
- Predii TSB-DTC Index — cross-reference table mapping DTCs to applicable TSBs for this YMME
- OEM Freeze-Frame Interpretation Guide — what freeze-frame parameters mean for this engine/transmission

**Outputs (per DTC):**
- `code`: DTC string (e.g., `P0087`)
- `description`: full OEM-specific description for this VIN
- `status`: active | pending | stored
- `tsb_links[]`: TSBs that reference this DTC for this YMME
- `diagnostic_path`: OEM-specified diagnostic steps for this code on this vehicle
- `probable_cause_rank[]`: ranked root causes from Predii repair history for this DTC + VIN pattern
- `warranty_implication`: whether this DTC triggers warranty coverage or prior auth

---

#### Agent 5: Warranty Context Agent
**Trigger:** VIN + `oem_id` + `ro_type` known
**Data Sources:**
- Predii OEM Warranty Rules Database — coverage terms, labor op codes, authorization requirements per OEM
- GM WCC (Warranty Claims Center) rules — real-time auth eligibility
- Toyota WAS coverage matrix
- Ford WUPS policy database
- Honda WarrantyLink coverage rules
- Subaru warranty special coverage adjustments

**Outputs:**
- `warranty_coverage`: active | expired | special_policy
- `coverage_details`: warranty type, expiry mileage/date, special policy code if applicable
- `labor_op_codes[]`: applicable OEM labor op codes for this repair
- `prior_auth_required`: boolean + auth process URL/instructions
- `parts_coverage[]`: OEM-covered parts with part numbers
- `submission_target`: OEM portal + submission method

---

#### Agent 6: Narrative Assembly Agent
**Trigger:** Tech signals "generate story" (voice or tap)
**Inputs:** All outputs from Agents 1–5 + tech shorthand/voice notes + part scans + DVI results
**Process:**
1. Assembles Concern from: NHTSA complaint match (Agent 2) + advisor shorthand expansion
2. Assembles Cause from: DTC enrichment (Agent 4) + tech notes + VIN spec grounding (Agent 1) + TSB references (Agent 3)
3. Assembles Correction from: tech notes + part scan log + OEM procedure (Agent 1 spec + Agent 3 TSB)
4. Runs OEM compliance validation against warranty rules (Agent 5)
5. Returns complete 3C draft + Predii Score + compliance issues list

---

## 4. Source Data Reference Map

| Data Point | Used In 3C | Source Agent | API / Database |
|-----------|-----------|-------------|----------------|
| YMME, engine code, trim | All sections | VIN Agent | NHTSA vPIC |
| Component names, torque values | Correction narrative | VIN Agent | Predii OEM Spec DB |
| OEM labor op codes | DMS submission | VIN Agent + Warranty Agent | Predii OEM Spec DB |
| NHTSA complaint text | Concern narrative | NHTSA Complaint Agent | NHTSA Complaints API |
| TSB number + title + procedure | Cause narrative | TSB/Recall Agent | Predii TSB Index |
| Recall campaign number + parts | Correction + DMS fields | TSB/Recall Agent | NHTSA Recalls API |
| DTC description + freeze-frame | Cause narrative | DTC Enrichment Agent | SAE J2012 + Predii DTC Overlay |
| DTC-to-TSB cross-reference | Cause narrative | DTC Enrichment Agent | Predii TSB-DTC Index |
| Warranty coverage type + expiry | Submission routing | Warranty Context Agent | Predii Warranty Rules DB |
| Prior authorization requirement | Compliance check | Warranty Context Agent | OEM Auth Rules |
| Parts OEM part numbers | Correction narrative | VIN Agent + Warranty Agent | OEM Parts Catalog |
| Service history / prior repairs | Concern context | VIN Agent | DMS Integration |

---

## 5. Smoke Tests

### ST-01: VIN Decode → OEM Spec Resolution

**Vehicle:** V04 — 2019 Toyota RAV4 2.5L AWD
**VIN:** `JTMN1RFV0KD468260`

**Input:**
```json
{ "action": "open_ro", "vin": "JTMN1RFV0KD468260" }
```

**Expected Agent Behavior:**
- VIN Agent decodes to: `2019 Toyota RAV4 XLE AWD 2.5L I4 (A25A-FXS)`
- `oem_id` = `toyota`
- OEM spec loaded: intake valve carbon cleaning procedure, GDI component names, 0W-20 oil spec
- TSB Agent surfaces: T-SB-0131-19, T-SB-0053-20 (both applicable to this YMME)
- Recall Agent: no open recalls for this VIN

**Pass Criteria:**
- [ ] YMME matches `2019 Toyota RAV4 2.5L I4 AWD`
- [ ] `oem_id` = `toyota`
- [ ] At least 1 TSB surfaced referencing cold start / misfire
- [ ] No false recall alerts
- [ ] Spec load latency < 2 seconds

---

### ST-02: Advisor Shorthand → Concern Expansion + NHTSA Match

**Vehicle:** V07 — 2018 Honda CR-V 1.5T AWD
**VIN:** `5J6RW2H89JL791593`

**Input:**
```json
{
  "vin": "5J6RW2H89JL791593",
  "advisor_note": "gas smell vents, oil above max, smells like fuel, hesitation cold start"
}
```

**Expected Agent Behavior:**
- NHTSA Complaint Agent matches to ODI complaint pattern for 2018 CR-V 1.5T oil dilution
- Concern draft generated: full sentence describing oil dilution condition in Honda-compliant language
- TSB Agent surfaces: TSB 19-079, A19-010
- Warranty Agent loads: Special Policy IL7-1911 — 8yr/unlimited coverage check

**Pass Criteria:**
- [ ] Concern field contains full sentence — no shorthand in output
- [ ] Concern mentions: gasoline odor, oil level above maximum, cold start hesitation
- [ ] TSB 19-079 surfaced in applicable TSBs
- [ ] Special Policy IL7-1911 identified in warranty coverage
- [ ] Oil dilution not confused with oil leak (disambiguation correct)

---

### ST-03: DTC Shorthand → Enrichment Without Scanner

**Vehicle:** V09 — 2019 Subaru Outback 2.5L
**VIN:** `4S4BSAFC3K3913715`

**Input:**
```json
{
  "vin": "4S4BSAFC3K3913715",
  "tech_note": "P0011 and P0420 stored, found during diag"
}
```

**Expected Agent Behavior:**
- DTC Enrichment Agent processes `P0011`:
  - Description: "Camshaft Position A — Timing Over-Advanced or System Performance (Bank 1)"
  - Subaru-specific: VVT solenoid deposit buildup secondary to oil consumption
  - TSB link: 02-157-20R, 16-216-19R
- DTC Enrichment Agent processes `P0420`:
  - Description: "Catalyst System Efficiency Below Threshold (Bank 1)"
  - Probable cause (VIN-specific): catalytic converter contamination from oil burning
  - Diagnostic path: upstream/downstream O2 sensor comparison per Subaru procedure
- Cross-reference: both codes linked — P0011 causes oil burning → P0420 secondary

**Pass Criteria:**
- [ ] Both DTCs enriched with Subaru-specific (not generic) descriptions
- [ ] P0011 linked to TSB 02-157-20R
- [ ] P0420 flagged as secondary to P0011 (root cause chain established)
- [ ] No scanner connection required — enrichment from VIN knowledge graph
- [ ] Enrichment latency < 1 second per code

---

### ST-04: Recall → Safety Routing + Warranty Pre-Population

**Vehicle:** V06 — 2019 Ford Explorer 2.3L EcoBoost
**VIN:** `1FM5K8D83KGA680482`

**Input:**
```json
{ "action": "open_ro", "vin": "1FM5K8D83KGA680482" }
```

**Expected Agent Behavior:**
- Recall Agent queries NHTSA recalls for 2019 Ford Explorer
- Recall 19S32 / NHTSA 19V-726 identified as open for this VIN
- `ro_type` automatically set to `warranty` with `warranty_type = recall`
- Campaign number `19S32` pre-populated in RO
- Parts pre-loaded: exhaust manifold gasket, body seal kit
- Labor op code `19S32B` set
- Customer safety notice flag set = true
- No prior auth required (safety recall — direct)

**Pass Criteria:**
- [ ] Recall 19S32 surfaced at intake (before any advisor input)
- [ ] `ro_type` = `warranty`, `warranty_type` = `recall`
- [ ] Campaign number pre-populated in draft
- [ ] Ford WUPS identified as submission target
- [ ] CO safety notice flag set
- [ ] Recall routing latency < 2 seconds from VIN open

---

### ST-05: End-to-End 3C Narrative Generation — Predii Score Validation

**Vehicle:** V05 — 2020 Ford F-150 5.0L V8
**VIN:** `1FTFW1E52LFA579371`

**Input (sequential, simulating live repair session):**
```
1. Advisor shorthand: "trans shudder 30-45mph light throttle, no CEL, getting worse"
2. Tech shorthand: "P0741 stored P07D5 stored, road test confirmed shudder 35mph light accel"
3. Tech shorthand: "TSB 19-2346 applicable, drained trans, filled 14qt XT-10-QLVC per TSB, road test 15mi no shudder"
```

**Expected 3C Narrative Output:**

> **Concern:**
> Customer states the transmission shudders and vibrates between 30–45 mph under light acceleration. Customer describes the sensation as similar to driving over a rumble strip. Condition has progressively worsened over the past several months. No Malfunction Indicator Lamp illumination reported.
>
> **Cause:**
> Vehicle confirmed the customer concern during a road test — transmission shudder verified at approximately 35 mph under light throttle application. Scan tool data retrieved Diagnostic Trouble Codes P0741 (Torque Converter Clutch Circuit Performance / Stuck Off — stored) and P07D5 (Transmission Fluid Degraded — stored). Ford Technical Service Bulletin 19-2346 (10-Speed Automatic Transmission Shudder / Vibration — applicable to 2020 F-150 5.0L with 10R80 transmission) confirmed as applicable to this vehicle. Root cause identified as torque converter clutch shudder due to transmission fluid degradation.
>
> **Correction:**
> Transmission fluid drained and replaced per Ford TSB 19-2346 procedure. Installed 14 quarts of Motorcraft MERCON ULV Automatic Transmission Fluid (XT-10-QLVC). Fault codes cleared. Road test performed — 15 miles driven, no reoccurrence of transmission shudder confirmed.

**Pass Criteria:**
- [ ] Concern: mentions mph range, symptom description, progressive nature, no MIL — all from advisor shorthand
- [ ] Cause: includes DTC numbers with full descriptions, road test confirmation, TSB reference with number and title
- [ ] Correction: includes fluid type with part number, quantity, procedure reference, road test distance and outcome
- [ ] Predii Score ≥ 90 (warranty-ready)
- [ ] Labor op code `307B08A` populated in DMS fields
- [ ] No acronyms in final narrative (XT-10-QLVC expanded or defined inline)
- [ ] Generation latency < 5 seconds from "generate story" signal

---

## 6. Synthetic Data Notes

| Vehicle | Real NHTSA Data Used | Synthetic / Extended |
|---------|---------------------|----------------------|
| V01 — Silverado | NHTSA complaint pattern (ODI 11308872) | TSB numbers verified; warranty auth process synthetic |
| V02 — Equinox | NHTSA complaint pattern (ODI 11389541) | Recall 20V-419 real; labor op codes synthetic |
| V03 — Camry | NHTSA complaint pattern (ODI 11427603) | Recall 20V-418 real; labor op codes from Toyota WAS format |
| V04 — RAV4 | NHTSA complaint pattern (ODI 11356219) | TSBs real; DTC enrichment procedure synthetic |
| V05 — F-150 | NHTSA complaint pattern (ODI 11391724) | TSB 19-2346 real; fluid part number real |
| V06 — Explorer | NHTSA complaint pattern (ODI 11287345) | Recall 19S32/19V-726 real; safety recall process real |
| V07 — CR-V | NHTSA complaint pattern (ODI 11264481) | TSB 19-079 real; Special Policy IL7-1911 real |
| V08 — Accord | NHTSA complaint pattern (ODI 11329877) | TSB 19-079 real; PCM update procedure synthetic |
| V09 — Outback | NHTSA complaint pattern (ODI 11344292) | TSB 02-157-20R real; Special Coverage WRS-92 synthetic |
| V10 — Forester | NHTSA complaint pattern (ODI 11401836) | TSB 16-183-20R real; CVT warranty extension real |

---

_Last updated: 2026-03-23_
