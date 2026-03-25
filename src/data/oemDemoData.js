// OEM Demo Data — Bay Area Auto Group (WrenchIQ-OEM Demo Tenant)
// AE-853: 10-vehicle demo registry — 2 per make: GM, Toyota, Ford, Honda, Subaru
// All VINs are structurally valid demo identifiers per the 3C Demo Data Specification.

export const OEM_DEALER = {
  name: "Bay Area Auto Group",
  address: "3900 El Camino Real, Palo Alto, CA 94306",
  dealerCode: "DEMO-01",
  oemMakes: ["Chevrolet", "Toyota", "Ford", "Honda", "Subaru"],
  dms: "CDK",
  dmsConnected: true,
  bays: 30,
  advisorCount: 8,
  laborRate: 185,
  fixedOpsDirector: "Ryan Cho",
  fixedOpsInitials: "RC",
};

export const OEM_ADVISORS = [
  { id: "adv-001", name: "Ryan Cho",       role: "Fixed Ops Director", initials: "RC", complianceScore: 94, approvalRate: 97, rosThisMonth: 0,  rejected: 0,  avgWriteUpMin: null },
  { id: "adv-002", name: "Jessica Torres", role: "Service Advisor",    initials: "JT", complianceScore: 78, approvalRate: 82, rosThisMonth: 47, rejected: 8,  avgWriteUpMin: 6.2 },
  { id: "adv-003", name: "David Kim",      role: "Service Advisor",    initials: "DK", complianceScore: 91, approvalRate: 94, rosThisMonth: 61, rejected: 4,  avgWriteUpMin: 4.8 },
  { id: "adv-004", name: "Maria Santos",   role: "Service Advisor",    initials: "MS", complianceScore: 85, approvalRate: 89, rosThisMonth: 53, rejected: 6,  avgWriteUpMin: 5.5 },
  { id: "adv-005", name: "Tyler Beck",     role: "Service Advisor",    initials: "TB", complianceScore: 62, approvalRate: 71, rosThisMonth: 39, rejected: 11, avgWriteUpMin: 8.1 },
  { id: "adv-006", name: "Priya Nair",     role: "Service Advisor",    initials: "PN", complianceScore: 88, approvalRate: 92, rosThisMonth: 55, rejected: 4,  avgWriteUpMin: 5.0 },
  { id: "adv-007", name: "Carlos Reyes",   role: "Service Advisor",    initials: "CR", complianceScore: 73, approvalRate: 79, rosThisMonth: 44, rejected: 9,  avgWriteUpMin: 7.2 },
  { id: "adv-008", name: "Amy Chen",       role: "Service Advisor",    initials: "AC", complianceScore: 96, approvalRate: 98, rosThisMonth: 58, rejected: 1,  avgWriteUpMin: 3.9 },
];

export const OEM_TECHNICIANS = [
  { id: "tech-001", name: "Marcus Williams", initials: "MW", certified: "GM Master",     years: 12, activeRO: "RO-3001", bay: "Bay 4"  },
  { id: "tech-002", name: "Darnell Jackson", initials: "DJ", certified: "Toyota Senior", years: 8,  activeRO: "RO-3004", bay: "Bay 7"  },
  { id: "tech-003", name: "Sophie Laurent",  initials: "SL", certified: "Ford Certified",years: 5,  activeRO: "RO-3005", bay: "Bay 2"  },
  { id: "tech-004", name: "James Park",      initials: "JP", certified: "Honda Master",  years: 10, activeRO: "RO-3007", bay: "Bay 9"  },
];

// ── Demo Vehicle Registry ─────────────────────────────────────────────────────
// V01–V10 per AE-853 spec. VINs are demo identifiers — check digit is synthetic.
export const DEMO_VEHICLES = [
  { id: "V01", vin: "1GCPWDED8KZ246810", year: 2019, make: "Chevrolet", model: "Silverado 1500", trim: "LT Trail Boss",     engine: "5.3L V8 EcoTec3 (L84)" },
  { id: "V02", vin: "2GNAXUEV4L6135792", year: 2020, make: "Chevrolet", model: "Equinox",        trim: "LT FWD",            engine: "1.5L Turbo I4 (LYX)"   },
  { id: "V03", vin: "4T1G11AK3MU357159", year: 2021, make: "Toyota",    model: "Camry",           trim: "XSE FWD",           engine: "2.5L I4 (A25B-FKS)"    },
  { id: "V04", vin: "JTMN1RFV0KD468260", year: 2019, make: "Toyota",    model: "RAV4",            trim: "XLE AWD",           engine: "2.5L I4 (A25A-FXS)"    },
  { id: "V05", vin: "1FTFW1E52LFA579371", year: 2020, make: "Ford",      model: "F-150",           trim: "XLT SuperCrew",     engine: "5.0L V8 Ti-VCT (Coyote)"},
  { id: "V06", vin: "1FM5K8D83KGA680482", year: 2019, make: "Ford",      model: "Explorer",        trim: "XLT FWD",           engine: "2.3L EcoBoost I4"      },
  { id: "V07", vin: "5J6RW2H89JL791593", year: 2018, make: "Honda",     model: "CR-V",            trim: "EX-L AWD",          engine: "1.5L Turbo I4 (L15B7)" },
  { id: "V08", vin: "1HGCV1F39KA802604", year: 2019, make: "Honda",     model: "Accord",          trim: "Sport Sedan",       engine: "1.5L Turbo I4 (L15B7)" },
  { id: "V09", vin: "4S4BSAFC3K3913715", year: 2019, make: "Subaru",    model: "Outback",         trim: "2.5i Premium AWD",  engine: "2.5L Boxer H4 (FB25)"  },
  { id: "V10", vin: "JF2SKAFC2LH024826", year: 2020, make: "Subaru",    model: "Forester",        trim: "Sport AWD",         engine: "2.5L Boxer H4 (FB25)"  },
];

// License plate → VIN demo lookup (12 CA plates per AE-853 spec)
export const DEMO_PLATE_TABLE = {
  "7ABC123": "1GCPWDED8KZ246810", // V01 Silverado
  "8BCD234": "2GNAXUEV4L6135792", // V02 Equinox
  "6DEF345": "4T1G11AK3MU357159", // V03 Camry
  "5EFG456": "JTMN1RFV0KD468260", // V04 RAV4
  "4FGH567": "1FTFW1E52LFA579371", // V05 F-150
  "3GHI678": "1FM5K8D83KGA680482", // V06 Explorer
  "2HIJ789": "5J6RW2H89JL791593", // V07 CR-V
  "9IJK890": "1HGCV1F39KA802604", // V08 Accord
  "1JKL901": "4S4BSAFC3K3913715", // V09 Outback
  "7KLM012": "JF2SKAFC2LH024826", // V10 Forester
  "8LMN123": "1GCPWDED8KZ246810", // V01 alt plate
  "6MNO234": "1FM5K8D83KGA680482", // V06 alt plate (safety recall demo)
};

// ── RO Queue ─────────────────────────────────────────────────────────────────
export const OEM_ROS = [
  // V01 — 2019 Chevrolet Silverado 1500 5.3L — AFM Oil Consumption
  {
    id: "RO-3001",
    vin: "1GCPWDED8KZ246810",
    year: 2019, make: "Chevrolet", model: "Silverado 1500", trim: "LT Trail Boss",
    mileage: 38420,
    customer: "Robert Chen",
    complaint: "Engine oil level drops approximately 1 quart every 1,000 miles. No visible external leaks. Oil pressure warning light flickered at idle. Check engine light on.",
    advisorNotes: "oil low 1qt/1k mi, CEL on, oil pressure lite flicker",
    dtcs: ["P0521", "P0014", "P0008"],
    tsbs: [
      { number: "PIP5622E", title: "Excessive Engine Oil Consumption — AFM/DOD Lifter Collapse", confidence: 97 },
      { number: "19-NA-355", title: "Oil Consumption Diagnostic Procedure — L84/L87 Engines", confidence: 89 },
      { number: "PIP5739", title: "Engine Oil Pressure Low / MIL Illuminated — P0521", confidence: 84 },
    ],
    recall: null,
    warrantyType: "warranty",
    specialCoverage: null,
    techNotes: "AFM lifter collapse confirmed — oil consumption test: 0.8 qt/1000mi. P0521 active. Lifter valley: oil coking per PIP5622E. Engine teardown pre-auth submitted to GM WCC.",
    advisorId: "adv-002",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "J4301", confidence: 89 },
      { code: "J3205", confidence: 97 },
    ],
  },

  // V02 — 2020 Chevrolet Equinox 1.5T — Engine Stall / Recall 20V-419
  {
    id: "RO-3002",
    vin: "2GNAXUEV4L6135792",
    year: 2020, make: "Chevrolet", model: "Equinox", trim: "LT FWD",
    mileage: 24150,
    customer: "Lisa Park",
    complaint: "Engine stalled 3 times at highway speed (~65 mph) without warning. Power steering and brakes lost briefly each time. Engine restarts after 2 minutes. No warning lights before stall.",
    advisorNotes: "engine stall hwy 65mph, no warning, happened 3x, restarts ok",
    dtcs: ["P0087", "P0171", "P0300"],
    tsbs: [
      { number: "PIP5626B", title: "Engine Stall / Hesitation — Fuel Injector Deposit Buildup", confidence: 72 },
      { number: "PIE0956",  title: "Intermittent Engine Stall at Highway Speed — Low Fuel Rail Pressure", confidence: 88 },
    ],
    recall: {
      campaign: "20V-419",
      title: "Engine Stall — Low-Pressure Fuel Pump Failure",
      status: "Open — not yet performed on this VIN",
      isSafety: false,
    },
    warrantyType: "recall",
    specialCoverage: null,
    techNotes: "Fuel pump low pressure confirmed: P0087 stored. LPFP output: 3.2 bar vs 5.5 bar spec. Recall 20V-419 applies. Parts ordered from GM PDC.",
    advisorId: "adv-003",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "K4521", confidence: 99 },
      { code: "K3102", confidence: 45 },
    ],
  },

  // V03 — 2021 Toyota Camry 2.5L — Fuel Pump Recall 20V-418 (pre-generated)
  {
    id: "RO-3003",
    vin: "4T1G11AK3MU357159",
    year: 2021, make: "Toyota", model: "Camry", trim: "XSE FWD",
    mileage: 19870,
    customer: "Jennifer Wang",
    complaint: "Intermittent hesitation on acceleration 20–45 mph, worse when cold. Fuel economy dropped ~4 MPG. Check engine light on and off twice.",
    advisorNotes: "hesitation 20-45mph, worse cold, mpg down, CEL on/off",
    dtcs: ["P0087", "P1250"],
    tsbs: [
      { number: "T-SB-0088-20", title: "Engine Hesitation / Surge — Low Pressure Fuel Pump Performance", confidence: 93 },
      { number: "T-SB-0061-21", title: "MIL ON — P0087/P1250 — Fuel Pressure Insufficient",            confidence: 97 },
    ],
    recall: {
      campaign: "20V-418",
      title: "Low-Pressure Fuel Pump May Fail — Possible Engine Stall",
      status: "Open — not yet performed",
      isSafety: false,
    },
    warrantyType: "recall",
    specialCoverage: null,
    techNotes: "P0087 active, P1250 active. Fuel pressure: 42 psi vs 54 psi spec at idle. Recall 20V-418 applies. Parts ordered from Toyota PDC.",
    advisorId: "adv-004",
    status: "Ready for DMS Push",
    isWarranty: true,
    opCode: "EF9D-20",
    flatRateHrs: 1.2,
    narrative: {
      complaint: "Customer states vehicle exhibits intermittent hesitation during acceleration between 20 and 45 miles per hour. Customer reports condition is worse when engine is cold and fuel economy has decreased approximately 4 miles per gallon. Malfunction indicator lamp has illuminated and extinguished on two separate occasions per customer statement.",
      cause: "Diagnostic scan retrieved active diagnostic trouble codes P0087 (Fuel Rail/System Pressure Too Low) and P1250 (Fuel Pressure Hold — Fuel Pump Monitor). Fuel pressure test performed — 42 PSI measured versus 54 PSI specification at idle. Low-pressure fuel pump performance confirmed below specification per Toyota TSBs T-SB-0088-20 and T-SB-0061-21. Condition causally linked to NHTSA Safety Recall 20V-418 low-pressure fuel pump assembly degradation.",
      correction: "Recall campaign 20V-418 (Operation EF9D) performed at no charge to customer. Low-pressure fuel pump assembly replaced (Part No. 23221-25030, supersedes 23221-25020). Toyota WAS submission completed under Recall Operation EF9D-20. Fuel pressure post-repair: 53 PSI at idle — within specification. DTCs P0087 and P1250 cleared. Road tested 18 miles — no hesitation events. Recall performed complete.",
    },
    complianceScore: 96,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "EF9D-20", confidence: 99 },
    ],
  },

  // V04 — 2019 Toyota RAV4 2.5L — Cold Start Misfire / Carbon Buildup
  {
    id: "RO-3004",
    vin: "JTMN1RFV0KD468260",
    year: 2019, make: "Toyota", model: "RAV4", trim: "XLE AWD",
    mileage: 31540,
    customer: "Michael Torres",
    complaint: "Rough idle and vibration on cold starts below 40°F, lasting 3–5 minutes. Check engine light on with misfire codes. Two previous repair attempts at another dealer did not resolve.",
    advisorNotes: "rough idle cold start <40F, vibration 3-5 min, CEL misfire codes, 2x prev repair attempt",
    dtcs: ["P0300", "P0301", "P0171"],
    tsbs: [
      { number: "T-SB-0131-19", title: "Rough Engine Idle / Vibration on Cold Start — Carbon Buildup on Intake Valves", confidence: 95 },
      { number: "T-SB-0053-20", title: "MIL ON P0300/P0301–P0304 — Misfire on Cold Start", confidence: 91 },
    ],
    recall: null,
    warrantyType: "warranty",
    specialCoverage: null,
    techNotes: "P0300/P0301 active cold, clear warm. Borescope: heavy carbon on intake valves cyl 1-4. Injector spray pattern impaired. TSB T-SB-0131-19 confirmed. Induction service authorized.",
    advisorId: "adv-005",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "1250344", confidence: 95 },
      { code: "1251101", confidence: 82 },
    ],
  },

  // V05 — 2020 Ford F-150 5.0L — 10R80 Transmission Shudder
  {
    id: "RO-3005",
    vin: "1FTFW1E52LFA579371",
    year: 2020, make: "Ford", model: "F-150", trim: "XLT SuperCrew",
    mileage: 28760,
    customer: "James Patterson",
    complaint: "Transmission shudders and vibrates between 30–45 mph under light acceleration, like driving over a rumble strip. Intermittent but worsening over 3 months. No check engine light.",
    advisorNotes: "trans shudder 30-45mph light throttle, no CEL, getting worse",
    dtcs: ["P0741", "P07D5"],
    tsbs: [
      { number: "19-2346", title: "10R80 Transmission Shudder / Vibration — Fluid Exchange",                   confidence: 97 },
      { number: "SSM 49537", title: "10R80 Shudder Between 25–50 MPH — Torque Converter Clutch",            confidence: 89 },
    ],
    recall: null,
    warrantyType: "warranty",
    specialCoverage: null,
    techNotes: "P0741 stored, P07D5 stored. Trans fluid: brown, burnt smell — degraded. TCC shudder confirmed 30-45mph per SSM 49537. Fluid exchange per TSB 19-2346 required. 14 qts MERCON ULV.",
    advisorId: "adv-006",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "307B08A", confidence: 97 },
    ],
  },

  // V06 — 2019 Ford Explorer 2.3L — Exhaust CO Safety Recall 19S32 (pre-generated)
  {
    id: "RO-3006",
    vin: "1FM5K8D83KGA680482",
    year: 2019, make: "Ford", model: "Explorer", trim: "XLT FWD",
    mileage: 44100,
    customer: "Sarah Mitchell",
    complaint: "Strong exhaust odor inside cabin at highway speeds, especially with HVAC on recirculate. Passengers reported headaches, dizziness, nausea. CO detector inside vehicle measured elevated levels.",
    advisorNotes: "exhaust fumes in cabin hwy, passengers dizzy/headache, worse windows up",
    dtcs: [],
    tsbs: [
      { number: "19-2130", title: "Exhaust Odor / Carbon Monoxide in Passenger Compartment", confidence: 99 },
    ],
    recall: {
      campaign: "19S32 / NHTSA 19V-726",
      title: "Exhaust Leak into Passenger Compartment — Possible CO Exposure",
      status: "Open — Safety Recall — Not Performed",
      isSafety: true,
    },
    warrantyType: "recall",
    specialCoverage: null,
    techNotes: "No DTCs. Physical inspection per Recall 19S32 confirmed exhaust leak at rear manifold-to-pipe junction. CO detector inside cabin: 48 ppm (threshold 35 ppm). Safety recall 19S32 applies. Parts ordered.",
    advisorId: "adv-002",
    status: "Ready for DMS Push",
    isWarranty: true,
    opCode: "19S32B",
    flatRateHrs: 2.5,
    narrative: {
      complaint: "Customer states a strong exhaust odor is present inside the passenger compartment during highway speed operation when the HVAC system is set to recirculate. Customer reports multiple occupants experienced headaches, dizziness, and nausea. Customer placed a carbon monoxide detector inside the vehicle — detector registered elevated CO concentration.",
      cause: "No diagnostic trouble codes present. Physical inspection performed per NHTSA Safety Recall 19S32 / NHTSA 19V-726 procedure. Exhaust leak confirmed at rear exhaust manifold-to-pipe junction seal. Carbon monoxide detector measurement inside passenger compartment registered 48 parts per million (regulatory threshold 35 PPM). Condition consistent with Recall 19S32 exhaust leak pathway into passenger compartment.",
      correction: "Safety Recall 19S32 performed at no charge to customer — no mileage restriction applicable. Rear exhaust manifold-to-pipe junction disassembled. Exhaust manifold gasket replaced (Part No. HB5Z-9450-A). Body seal kit replaced (Part No. LB5Z-7801812-A). All exhaust fasteners torqued to specification. CO detector post-repair: 0 PPM — within safe range. Ford WUPS submission completed under Recall Operation Code 19S32B. Customer CO safety notice provided at delivery.",
    },
    complianceScore: 98,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "19S32B", confidence: 99 },
    ],
  },

  // V07 — 2018 Honda CR-V 1.5T — Oil Dilution / Special Policy IL7-1911
  {
    id: "RO-3007",
    vin: "5J6RW2H89JL791593",
    year: 2018, make: "Honda", model: "CR-V", trim: "EX-L AWD",
    mileage: 29330,
    customer: "Kevin Nakamura",
    complaint: "Gasoline smell from HVAC vents on cold mornings. Oil level above the max mark — oil smells like fuel. Intermittent engine hesitation on cold starts below 35°F. Concerned about fire risk.",
    advisorNotes: "gas smell vents, oil above max, smells like fuel, hesitation cold start <35F",
    dtcs: [],
    tsbs: [
      { number: "19-079",   title: "Engine Oil Dilution — Cold Climate Operation",                  confidence: 98 },
      { number: "A19-010",  title: "Oil Level Increasing / Gasoline Odor — L15B Turbo Diagnosis",  confidence: 94 },
    ],
    recall: null,
    warrantyType: "specialPolicy",
    specialCoverage: {
      program: "IL7-1911",
      description: "Honda Customer Satisfaction Program — Oil Dilution — Extended to 8 yr / unlimited miles (CA qualifying state)",
    },
    techNotes: "Oil level 1.5 qt above max. Fuel odor in oil confirmed. PCM data: extended cold-start injection duration. TSB 19-079 / A19-010 apply. Special Policy IL7-1911 — CA qualifying state. PCM reprogram + oil change.",
    advisorId: "adv-007",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "6P200-001", confidence: 98 },
      { code: "6N200-005", confidence: 87 },
    ],
  },

  // V08 — 2019 Honda Accord 1.5T — Oil Dilution / Special Policy IL7-1911 (pre-generated)
  {
    id: "RO-3008",
    vin: "1HGCV1F39KA802604",
    year: 2019, make: "Honda", model: "Accord", trim: "Sport Sedan",
    mileage: 22880,
    customer: "Priya Singh",
    complaint: "Oil level rising — dipstick above maximum at only 4,200 miles since last change. Oil smells like gasoline. Rough idle and hesitation on cold mornings. Concerned about engine damage.",
    advisorNotes: "oil level rising 4200mi, smells gas, rough idle hesitation cold",
    dtcs: [],
    tsbs: [
      { number: "19-079",  title: "Engine Oil Dilution — Cold Climate Operation",               confidence: 96 },
      { number: "A20-003", title: "Updated PCM Calibration — Fuel Injection Strategy (Cold Start)", confidence: 91 },
    ],
    recall: null,
    warrantyType: "specialPolicy",
    specialCoverage: {
      program: "IL7-1911",
      description: "Honda Customer Satisfaction Program — Oil Dilution — Extended to 8 yr / unlimited miles (CA qualifying state)",
    },
    techNotes: "Oil level 0.8 qt above max. Fuel smell confirmed. PCM cold-start injection strategy — fuel wash-down. TSB 19-079 / A20-003 apply. Special Policy IL7-1911 — CA qualifying. PCM update + oil service.",
    advisorId: "adv-008",
    status: "Ready for DMS Push",
    isWarranty: true,
    opCode: "6E501-008",
    flatRateHrs: 1.0,
    narrative: {
      complaint: "Customer states engine oil level has risen significantly — dipstick reads above the maximum mark at only 4,200 miles since last oil change. Customer reports oil has a distinct gasoline odor. Customer also states rough engine idle and hesitation during cold morning operation. Customer expressed concern regarding potential long-term engine damage.",
      cause: "Engine oil level inspection confirmed — oil level 0.8 quarts above maximum dipstick mark. Fuel contamination odor confirmed. PCM diagnostic data retrieved — cold-start fuel injection strategy identified as cause of cylinder wall fuel wash-down into oil sump. Condition consistent with GDI engine oil dilution in cold climate operation per Honda TSBs 19-079 and A20-003. Honda Special Policy IL7-1911 applies — California is a qualifying cold-climate state under program criteria.",
      correction: "Honda Special Policy IL7-1911 performed at no charge to customer. PCM updated to revised cold-start fuel injection strategy per TSB A20-003 (Reprogramming Operation No. 6E501-008). Engine oil and filter replaced with Honda Genuine Motor Oil 0W-20 (Part No. 08798-9035). Drain plug washer replaced. Honda WarrantyLink submission completed under Special Policy IL7-1911. Road tested 10 miles including cold start cycle — oil odor absent, engine idle smooth. Follow-up oil level check scheduled at next visit.",
    },
    complianceScore: 93,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "6E501-008", confidence: 91 },
      { code: "6P200-001", confidence: 98 },
    ],
  },

  // V09 — 2019 Subaru Outback 2.5L — Oil Consumption / SCA WRS-92
  {
    id: "RO-3009",
    vin: "4S4BSAFC3K3913715",
    year: 2019, make: "Subaru", model: "Outback", trim: "2.5i Premium AWD",
    mileage: 36200,
    customer: "David Walsh",
    complaint: "Engine oil drops ~1 qt per 800–1,000 miles. No visible leaks, no blue smoke. Oil level goes below minimum between oil changes. Previous dealer said it was 'within spec' — customer disputes.",
    advisorNotes: "oil consumption 1qt/800mi, no leaks, no smoke, dealer said 'within spec' prev visit",
    dtcs: ["P0011", "P0420"],
    tsbs: [
      { number: "02-157-20R", title: "Engine Oil Consumption — Diagnosis and Repair Procedure (FB25/FB20)", confidence: 94 },
      { number: "16-216-19R", title: "Oil Consumption — Piston Ring Land Inspection Procedure",             confidence: 87 },
    ],
    recall: null,
    warrantyType: "specialPolicy",
    specialCoverage: {
      program: "WRS-92",
      description: "Subaru Special Coverage Adjustment — FB25 Oil Consumption — Extended to 8 yr / 100,000 mi if consumption > 1 qt per 1,200 mi confirmed",
    },
    techNotes: "Oil consumption test complete: 0.9 qt/1,200 mi — above SCA WRS-92 threshold. P0011 stored (VVT solenoid deposit). P0420 stored (cat contamination from oil burning). Ring land inspection: carbon confirmed per TSB 16-216-19R. TAC submission in progress.",
    advisorId: "adv-003",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "12181AA010", confidence: 94 },
      { code: "12100AJ950", confidence: 76 },
    ],
  },

  // V10 — 2020 Subaru Forester 2.5L — CVT Shudder
  {
    id: "RO-3010",
    vin: "JF2SKAFC2LH024826",
    year: 2020, make: "Subaru", model: "Forester", trim: "Sport AWD",
    mileage: 18440,
    customer: "Emma Rodriguez",
    complaint: "Transmission shudders strongly during acceleration from stop, 5–20 mph. Feels like clutch slipping. Worse when warm. Progressively worsening over 6 months. No check engine light.",
    advisorNotes: "trans shudder 5-20mph from stop, worse when warm, progressing, no CEL",
    dtcs: ["P0868", "P0700"],
    tsbs: [
      { number: "16-183-20R", title: "Lineartronic CVT — Judder / Shudder — Fluid Replacement Procedure",  confidence: 96 },
      { number: "02-177-21R", title: "CVT Shudder — Updated Fluid Formulation and Cooler Line Flush",      confidence: 88 },
    ],
    recall: null,
    warrantyType: "warranty",
    specialCoverage: {
      program: "CVT Extended Warranty",
      description: "Subaru CVT Extended Warranty: 10 yr / 100,000 mi — active (18,440 mi)",
    },
    techNotes: "P0868 stored (CVT fluid pressure low). P0700 stored (TCM secondary). CVT fluid: brown, degraded below HCF-2 spec. Shudder confirmed 5-20mph under load. TSBs 16-183-20R / 02-177-21R apply. CVT warranty (10yr/100k) active.",
    advisorId: "adv-006",
    status: "Pending Write-up",
    isWarranty: true,
    opCode: null,
    flatRateHrs: null,
    narrative: null,
    complianceScore: null,
    dmsPushed: false,
    opCodeSuggestions: [
      { code: "31100FJ040", confidence: 96 },
      { code: "31100FJ050", confidence: 88 },
    ],
  },
];

// ── Op Code Registry — All Makes ──────────────────────────────────────────────
export const OP_CODES = {
  Chevrolet: [
    { code: "J3205",  description: "Engine Oil Consumption Diagnostic — L84/L86/L87 (AFM)",    flatRateHrs: 1.5, preAuthThreshold: null, notes: null },
    { code: "J4301",  description: "AFM/DOD Lifter Replacement — L84/L86/L87 5.3L/6.2L",       flatRateHrs: 4.5, preAuthThreshold: 2500, notes: "Pre-auth required — GM WCC approval before teardown" },
    { code: "K4521",  description: "Low Pressure Fuel Pump Replacement — Recall 20V-419",       flatRateHrs: 1.5, preAuthThreshold: null, notes: "Recall operation — parts supplied by GM PDC" },
    { code: "K3102",  description: "Fuel Injector Cleaning — LYX 1.5T Turbo",                  flatRateHrs: 1.0, preAuthThreshold: null, notes: null },
  ],
  Toyota: [
    // Ignition / Misfire (1250xx series — TIS coil/ignition family)
    { code: "1250A44",  description: "Engine Misfire — Single Cylinder — Coil-on-Plug Replacement",          flatRateHrs: 1.0, preAuthThreshold: null, notes: null },
    { code: "1250B44",  description: "Engine Misfire — Single Cylinder — Coil-on-Plug + Spark Plug",         flatRateHrs: 1.5, preAuthThreshold: null, notes: null },
    { code: "1250C44",  description: "Engine Misfire — All Cylinders — Full COP + Spark Plug Set",           flatRateHrs: 2.5, preAuthThreshold: null, notes: null },
    // Emissions / Catalyst (1762xx series — TIS catalyst family)
    { code: "1762A00",  description: "Catalyst System Efficiency — Diagnostic Only (P0420 evaluation)",      flatRateHrs: 0.5, preAuthThreshold: null, notes: null },
    { code: "1762B44",  description: "Catalytic Converter Assembly Replacement — Bank 1",                    flatRateHrs: 2.5, preAuthThreshold: 1200, notes: "Pre-auth required — Toyota WCC approval over $1,200" },
    // Fuel / AFR (1602xx series — TIS fuel/induction family)
    { code: "1602A44",  description: "Lean Fuel Trim — Air-Fuel Ratio (A/F) Sensor Replacement Bank 1",     flatRateHrs: 1.2, preAuthThreshold: null, notes: null },
    { code: "1602B44",  description: "Lean Fuel Trim — MAF Sensor Replacement + Intake Air Cleaning",       flatRateHrs: 1.8, preAuthThreshold: null, notes: null },
    // Driveshaft / CV Axle (3114xx series — TIS driveline family)
    { code: "3114A44",  description: "Drive Shaft Assembly Replacement — Left Front (LH)",                  flatRateHrs: 2.2, preAuthThreshold: null, notes: null },
    { code: "3114B44",  description: "Drive Shaft Assembly Replacement — Right Front (RH)",                 flatRateHrs: 2.2, preAuthThreshold: null, notes: null },
    { code: "3114C44",  description: "Drive Shaft Assembly Replacement — Both Front (LH + RH)",             flatRateHrs: 3.5, preAuthThreshold: 1500, notes: "Pre-auth required — over 3.0 flat rate hours" },
    // Brakes (3524xx series — TIS brake family)
    { code: "3524A44",  description: "Disc Brake Pad Kit Replacement — Front Axle",                         flatRateHrs: 1.0, preAuthThreshold: null, notes: null },
    { code: "3524B44",  description: "Disc Brake Pad + Rotor Replacement — Front Axle",                     flatRateHrs: 1.8, preAuthThreshold: null, notes: null },
    // Maintenance
    { code: "0000A00",  description: "Scheduled Maintenance — Engine Oil + Filter + Multi-Point Inspection", flatRateHrs: 1.0, preAuthThreshold: null, notes: null },
    { code: "3340A44",  description: "Automatic Transmission Fluid Exchange — ATF WS",                      flatRateHrs: 1.5, preAuthThreshold: null, notes: null },
    // Recall / Special ops (campaign-specific codes from Toyota WAS)
    { code: "EF9D-20",  description: "Low Pressure Fuel Pump Replacement — Safety Recall 20V-418",          flatRateHrs: 1.2, preAuthThreshold: null, notes: "Recall op — Toyota WAS submission required. Parts from Toyota PDC." },
    // GDI induction / carbon (campaign TSB ops)
    { code: "1250344",  description: "Intake Valve Carbon Deposit Cleaning — GDI Induction Service (A25A/A25B)", flatRateHrs: 2.0, preAuthThreshold: null, notes: "Per TSB T-SB-0131-19" },
    { code: "1251101",  description: "Fuel Injector Deposit Service — Top Engine Cleaner Application",      flatRateHrs: 0.8, preAuthThreshold: null, notes: "Per TSB T-SB-0131-19; performed with 1250344" },
  ],
  Ford: [
    { code: "307B08A", description: "10R80 Transmission Fluid Exchange per TSB 19-2346",            flatRateHrs: 1.5, preAuthThreshold: null, notes: "Use Motorcraft MERCON ULV only — 14 qts" },
    { code: "19S32B",  description: "Exhaust System Repair per Safety Recall 19S32",                flatRateHrs: 2.5, preAuthThreshold: null, notes: "Safety recall — no mileage limit. CO notice required at delivery" },
  ],
  Honda: [
    { code: "6P200-001", description: "Engine Oil Change + Dilution Level Inspection",              flatRateHrs: 0.5, preAuthThreshold: null, notes: null },
    { code: "6N200-005", description: "PCM Reprogramming — Cold Start Injection Strategy (TSB 19-079)", flatRateHrs: 0.7, preAuthThreshold: null, notes: "Honda WarrantyLink submission under IL7-1911" },
    { code: "6E501-008", description: "PCM Reprogramming — Updated Fuel Injection Cal (TSB A20-003)", flatRateHrs: 0.7, preAuthThreshold: null, notes: "Honda WarrantyLink submission under IL7-1911" },
  ],
  Subaru: [
    { code: "12181AA010", description: "Oil Consumption Test — Subaru Approved 1,200-Mile Protocol", flatRateHrs: 0.5, preAuthThreshold: null, notes: "Required before SCA WRS-92 parts authorization" },
    { code: "12100AJ950", description: "Engine Short Block Assembly Replacement — FB25",             flatRateHrs: 8.0, preAuthThreshold: 4000, notes: "SCA WRS-92 — Subaru TAC pre-auth required" },
    { code: "31100FJ040", description: "Lineartronic CVT Fluid Replacement per TSB 16-183-20R",     flatRateHrs: 1.5, preAuthThreshold: null, notes: "CVT extended warranty (10 yr / 100k mi)" },
    { code: "31100FJ050", description: "CVT Cooler Line Flush per TSB 02-177-21R",                  flatRateHrs: 0.8, preAuthThreshold: null, notes: "CVT extended warranty (10 yr / 100k mi)" },
  ],
};

// ── Generated Narratives ──────────────────────────────────────────────────────
// AI-generated 3C narratives for all 10 demo ROs.
// These are returned when the "Generate Narrative" button is pressed.
export const GENERATED_NARRATIVES = {
  "RO-3001": {
    opCode: "J4301",
    flatRateHrs: 4.5,
    complianceScore: 94,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states engine oil level drops approximately one quart per 1,000 miles under normal driving conditions. Customer reports no visible external oil leaks observed. Customer states oil pressure warning lamp illuminated briefly at idle and malfunction indicator lamp has illuminated. Condition has been progressively worsening per customer statement.",
      cause: "Diagnostic scan retrieved active diagnostic trouble code P0521 (Engine Oil Pressure Sensor/Switch Range/Performance), pending code P0014 (Camshaft Position B Timing Over-Advanced Bank 1), and stored code P0008 (Engine Position System Performance Bank 1). Active Fuel Management (AFM) oil consumption test performed per TSB PIP5622E — consumption confirmed at 0.8 quarts per 1,000 miles. Lifter valley inspection revealed AFM/DOD lifter collapse on cylinders 1, 4, 6, and 7 with evidence of oil coking in lifter valley area consistent with TSB PIP5622E and TSB 19-NA-355. Prior authorization obtained from GM Warranty Claims Center (WCC).",
      correction: "Engine disassembled per GM WCC authorization. All AFM/DOD lifters replaced with non-AFM lifter replacement kit (Part No. 12643752). Lifter valley cover and gasket replaced (Part No. 12673242). AFM system disabled via PCM calibration update. Engine oil and filter replaced with GM Dexos1 Full Synthetic 5W-30. Engine oil pressure post-repair within specification. All DTCs cleared. Road tested 15 miles — no oil pressure warning, no MIL recurrence.",
    },
  },
  "RO-3002": {
    opCode: "K4521",
    flatRateHrs: 1.5,
    complianceScore: 97,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states vehicle experienced three separate engine stall events while operating at highway speed of approximately 65 miles per hour over the past six months. Customer reports engine stalled without warning each time, resulting in temporary loss of power steering and brake assist. Customer states engine restarted after brief pause on all occasions. No malfunction indicator lamp illuminated prior to stall events. Fuel level was adequate at time of all events per customer statement.",
      cause: "Diagnostic scan retrieved stored diagnostic trouble codes P0087 (Fuel Rail/System Pressure Too Low), P0171 (System Too Lean Bank 1), and P0300 (Random/Multiple Cylinder Misfire). Low-pressure fuel pump (LPFP) output test performed — fuel rail pressure measured 3.2 bar versus 5.5 bar specification at idle. Low-pressure fuel pump failure confirmed consistent with NHTSA Safety Recall 20V-419. P0171 and P0300 confirmed secondary to low fuel rail pressure condition.",
      correction: "Recall campaign 20V-419 performed at no charge to customer. Low-pressure fuel pump assembly replaced (Part No. 42748808, supplied per GM PDC recall parts order). Fuel rail pressure post-repair: 5.4 bar — within specification. All stored DTCs cleared. Road tested 15 miles at highway speed — no stall events, no MIL. Recall performed complete.",
    },
  },
  "RO-3003": {
    opCode: "EF9D-20",
    flatRateHrs: 1.2,
    complianceScore: 96,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states vehicle exhibits intermittent hesitation during acceleration between 20 and 45 miles per hour. Customer reports condition is worse when engine is cold and fuel economy has decreased approximately 4 miles per gallon. Malfunction indicator lamp has illuminated and extinguished on two separate occasions per customer statement.",
      cause: "Diagnostic scan retrieved active diagnostic trouble codes P0087 (Fuel Rail/System Pressure Too Low) and P1250 (Fuel Pressure Hold — Fuel Pump Monitor). Fuel pressure test performed — 42 PSI measured versus 54 PSI specification at idle. Low-pressure fuel pump performance confirmed degraded per Toyota TSBs T-SB-0088-20 and T-SB-0061-21. Condition causally linked to NHTSA Safety Recall 20V-418 low-pressure fuel pump assembly failure.",
      correction: "Recall campaign 20V-418 (Operation EF9D) performed at no charge to customer. Low-pressure fuel pump assembly replaced (Part No. 23221-25030, supersedes 23221-25020). Toyota WAS submission completed under Recall Operation EF9D-20. Fuel pressure post-repair: 53 PSI at idle — within specification. DTCs P0087 and P1250 cleared. Road tested 18 miles — no hesitation events. Recall performed complete.",
    },
  },
  "RO-3004": {
    opCode: "1250344",
    flatRateHrs: 2.0,
    complianceScore: 93,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states vehicle exhibits rough engine idle and vibration on cold starts when ambient temperature is below 40 degrees Fahrenheit. Customer reports engine vibrates noticeably for 3 to 5 minutes following cold start. Malfunction indicator lamp has illuminated with misfire codes. Customer states two previous repair attempts at another facility have not resolved the concern.",
      cause: "Diagnostic scan retrieved active trouble codes P0300 (Random/Multiple Cylinder Misfire), P0301 (Cylinder 1 Misfire Detected), and pending code P0171 (System Too Lean Bank 1). Borescope inspection of all four cylinders confirmed heavy carbon accumulation on intake valve faces — restricting airflow during cold start operation. Fuel injector spray pattern test confirmed impaired atomization due to carbon interference. Condition consistent with GDI intake valve carbon buildup per Toyota TSBs T-SB-0131-19 and T-SB-0053-20. Previous repair attempts did not address intake valve carbon per repair history review.",
      correction: "Induction system service performed per TSB T-SB-0131-19 — Toyota Top Engine Cleaner (Part No. 00289-1EC00) applied to intake ports with engine at operating temperature per TSB procedure. Fuel injector service completed per TSB protocol — injector cleaning additive applied. Carbon deposit removal confirmed via post-service borescope inspection. Fuel trim reset and cold idle relearn performed. Road tested with multiple cold starts below 40°F — rough idle and vibration confirmed resolved. P0300 and P0301 monitors set complete. All DTCs cleared.",
    },
  },
  "RO-3005": {
    opCode: "307B08A",
    flatRateHrs: 1.5,
    complianceScore: 95,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states transmission exhibits shudder and vibration between 30 and 45 miles per hour under light acceleration. Customer describes sensation as similar to driving over a rumble strip. Condition is intermittent but has progressively worsened over the past three months. No malfunction indicator lamp illuminated.",
      cause: "Diagnostic scan retrieved stored trouble codes P0741 (Torque Converter Clutch Circuit Performance/Stuck Off) and P07D5 (Transmission Fluid Degraded). Transmission fluid inspection performed — fluid color brown with burnt odor indicating thermal degradation below MERCON ULV specification. Torque converter clutch shudder confirmed during road test between 28 and 47 MPH under light acceleration consistent with Ford TSBs 19-2346 and SSM 49537.",
      correction: "10R80 transmission fluid exchange performed per TSB 19-2346 procedure. Fourteen quarts of Motorcraft MERCON ULV Automatic Transmission Fluid (Part No. XT-10-QLVC) installed. Drain plug (Part No. -378758-S100) replaced. Fluid level verified per Ford specification. DTCs cleared. Road tested over shudder onset speed range 28–50 MPH — torque converter clutch engagement smooth, shudder confirmed resolved in all test conditions.",
    },
  },
  "RO-3006": {
    opCode: "19S32B",
    flatRateHrs: 2.5,
    complianceScore: 98,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states a strong exhaust odor is present inside the passenger compartment during highway speed operation when the HVAC system is set to recirculate. Customer reports multiple occupants experienced headaches, dizziness, and nausea. Customer placed a carbon monoxide detector inside the vehicle — detector registered elevated CO concentration.",
      cause: "No diagnostic trouble codes present. Physical inspection performed per NHTSA Safety Recall 19S32 / NHTSA 19V-726 procedure. Exhaust leak confirmed at rear exhaust manifold-to-pipe junction seal. Carbon monoxide detector measurement inside passenger compartment registered 48 parts per million (regulatory threshold 35 PPM). Condition consistent with Recall 19S32 exhaust leak pathway into passenger compartment.",
      correction: "Safety Recall 19S32 performed at no charge to customer — no mileage restriction applicable. Rear exhaust manifold-to-pipe junction disassembled. Exhaust manifold gasket replaced (Part No. HB5Z-9450-A). Body seal kit replaced (Part No. LB5Z-7801812-A). All exhaust fasteners torqued to Ford specification. CO detector post-repair: 0 PPM — within safe range. Ford WUPS submission completed under Recall Operation Code 19S32B. Customer carbon monoxide safety notice provided at vehicle delivery.",
    },
  },
  "RO-3007": {
    opCode: "6N200-005",
    flatRateHrs: 1.2,
    complianceScore: 91,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states a strong gasoline odor is present from HVAC vents, particularly during cold morning operation below 35 degrees Fahrenheit. Customer inspected engine oil dipstick and found oil level above maximum mark. Customer reports oil has a strong fuel smell. Customer also reports intermittent engine hesitation on cold starts. Customer expressed concern regarding potential fire risk and engine damage.",
      cause: "Engine oil level inspection confirmed — oil level 1.5 quarts above maximum dipstick mark. Fuel contamination odor confirmed in oil. PCM diagnostic data retrieved — extended cold-start fuel injection duration identified as cause of cylinder wall fuel wash-down into oil sump. Condition consistent with engine oil dilution in cold climate operation per Honda TSBs 19-079 and A19-010. Honda Special Policy IL7-1911 (Oil Dilution Customer Satisfaction Program) applicable — California is a qualifying cold-climate state.",
      correction: "Honda Special Policy IL7-1911 performed at no charge to customer. PCM reprogrammed to updated cold-start fuel injection calibration per TSB 19-079 (Reprogramming Operation No. 6N200-005). Engine oil and filter replaced with Honda Genuine Motor Oil 0W-20 (5 quarts) and oil filter (Part No. 15400-PLM-A01). Drain plug washer replaced. Honda WarrantyLink submission completed under Special Policy Code IL7-1911. Road tested 8 miles with cold start cycle — gasoline odor absent, oil level confirmed at full mark.",
    },
  },
  "RO-3008": {
    opCode: "6E501-008",
    flatRateHrs: 1.0,
    complianceScore: 93,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states engine oil level has risen significantly — dipstick reads above the maximum mark at only 4,200 miles since last oil change. Customer reports oil has a distinct gasoline odor. Customer also states rough engine idle and hesitation during cold morning operation. Customer expressed concern regarding potential long-term engine damage.",
      cause: "Engine oil level inspection confirmed — oil level 0.8 quarts above maximum dipstick mark. Fuel contamination odor confirmed. PCM data retrieved — cold-start fuel injection strategy identified as cause of cylinder wall fuel wash-down into oil sump. Condition consistent with GDI engine oil dilution per Honda TSBs 19-079 and A20-003. Honda Special Policy IL7-1911 applicable — California is a qualifying cold-climate state under program criteria.",
      correction: "Honda Special Policy IL7-1911 performed at no charge to customer. PCM updated to revised cold-start fuel injection strategy per TSB A20-003 (Reprogramming Operation No. 6E501-008). Engine oil and filter replaced with Honda Genuine Motor Oil 0W-20 (Part No. 08798-9035). Drain plug washer replaced. Honda WarrantyLink submission completed under Special Policy IL7-1911. Road tested 10 miles including cold start cycle — oil odor absent, engine idle smooth.",
    },
  },
  "RO-3009": {
    opCode: "12100AJ950",
    flatRateHrs: 8.0,
    complianceScore: 92,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states engine oil level drops approximately one quart per 800 to 1,000 miles under normal driving conditions. Customer reports no visible external oil leaks and no blue smoke from exhaust. Customer states oil level drops from full to below minimum mark between scheduled oil changes. Customer notes a previous dealer visit resulted in a finding of consumption within specification — customer disputes this assessment.",
      cause: "Subaru-approved oil consumption test performed over 1,200-mile interval per TSB 02-157-20R — consumption confirmed at 0.9 quarts per 1,200 miles, exceeding Subaru SCA WRS-92 threshold. Diagnostic scan retrieved stored codes P0011 (Camshaft Position A Timing Over-Advanced Bank 1 — VVT solenoid deposit buildup secondary to oil consumption) and P0420 (Catalyst System Efficiency Below Threshold Bank 1 — catalytic contamination from oil burning). Piston ring land inspection per TSB 16-216-19R confirmed ring land carbon deposits. Subaru Technical Assistance (TAC) contacted — engine short block replacement authorized under SCA WRS-92.",
      correction: "Subaru Special Coverage Adjustment WRS-92 performed at no charge to customer. Engine short block assembly replaced per TAC authorization (Part No. 12100AJ950). Piston ring set installed to factory specification (Part No. 12033AA410). VVT solenoid cleaned of carbon deposits. Engine oil and filter replaced with Subaru Genuine Motor Oil 0W-20. All DTCs cleared. Road tested 10 miles — no oil consumption indicators. Follow-up 1,200-mile oil consumption test scheduled at next visit.",
    },
  },
  "RO-3010": {
    opCode: "31100FJ040",
    flatRateHrs: 2.0,
    complianceScore: 96,
    complianceFlags: [],
    narrative: {
      complaint: "Customer states transmission exhibits strong shudder and vibration during low-speed acceleration from a complete stop, specifically between 5 and 20 miles per hour. Customer describes sensation as clutch slipping or drivetrain stuttering. Condition is most pronounced when engine is at operating temperature. Customer reports condition has progressively worsened over the past six months. No malfunction indicator lamp illuminated.",
      cause: "Diagnostic scan retrieved stored trouble codes P0868 (Transmission Fluid Pressure Sensor/Switch A Low — CVT fluid degradation) and P0700 (Transmission Control System Malfunction — secondary TCM fault). CVT fluid inspection performed — fluid brown and thermally degraded below Subaru HCF-2 specification. Lineartronic CVT shudder confirmed under road test load conditions 5–20 MPH with engine at operating temperature. Condition consistent with CVT torque converter clutch judder from degraded fluid per Subaru TSBs 16-183-20R and 02-177-21R.",
      correction: "Lineartronic CVT fluid replacement performed per TSBs 16-183-20R and 02-177-21R under Subaru CVT Extended Warranty (10 yr / 100,000 mi). CVT fluid fully exchanged — ten quarts of Subaru CVT Fluid HCF-2 (Part No. SOA427V1700) installed per TSB specification. CVT cooler line flush performed per TSB 02-177-21R. CVT drain plug washer replaced. Fluid level verified per Subaru specification. All DTCs cleared. Road tested over shudder onset speed range — CVT engagement smooth, shudder confirmed resolved in all tested conditions.",
    },
  },
};

// ── Warranty Claims (dashboard metrics) ──────────────────────────────────────
export const WARRANTY_CLAIMS = {
  thisMonth: {
    submitted: 127,
    approved: 109,
    rejected: 14,
    pending: 4,
    dollarSubmitted: 84200,
    dollarApproved: 72400,
    dollarRejected: 9300,
    dollarPending: 2500,
    approvalRate: 86,
    avgDaysToPayment: 12.4,
  },
  trend: [
    { month: "Oct", rate: 79, submitted: 98,  approved: 77  },
    { month: "Nov", rate: 82, submitted: 110, approved: 90  },
    { month: "Dec", rate: 84, submitted: 118, approved: 99  },
    { month: "Jan", rate: 81, submitted: 103, approved: 83  },
    { month: "Feb", rate: 83, submitted: 115, approved: 95  },
    { month: "Mar", rate: 86, submitted: 127, approved: 109 },
  ],
};

export const REJECTION_HISTORY = [
  { id: "rej-001", roId: "RO-2801", advisorId: "adv-005", date: "2026-03-18", amount: 1240, reason: "Correction section too vague — 'repaired issue' is insufficient",           category: "narrative", make: "Toyota",    model: "Camry"     },
  { id: "rej-002", roId: "RO-2798", advisorId: "adv-007", date: "2026-03-17", amount: 890,  reason: "Op code mismatch — electrical op code used for mechanical repair",           category: "opcode",    make: "Toyota",    model: "RAV4"      },
  { id: "rej-003", roId: "RO-2791", advisorId: "adv-002", date: "2026-03-15", amount: 2100, reason: "Aftermarket part used — OEM part number required for warranty",              category: "parts",     make: "Chevrolet", model: "Silverado" },
  { id: "rej-004", roId: "RO-2785", advisorId: "adv-005", date: "2026-03-14", amount: 780,  reason: "Pre-authorization missing — repair exceeded $1,000 threshold",              category: "preauth",   make: "Ford",      model: "F-150"     },
  { id: "rej-005", roId: "RO-2779", advisorId: "adv-007", date: "2026-03-12", amount: 1560, reason: "Complaint section vague — 'noise issue' is insufficient for warranty claim", category: "narrative", make: "Honda",     model: "CR-V"      },
  { id: "rej-006", roId: "RO-2774", advisorId: "adv-005", date: "2026-03-11", amount: 940,  reason: "No DTC referenced in cause section for electrical repair type",              category: "narrative", make: "Toyota",    model: "Camry"     },
  { id: "rej-007", roId: "RO-2769", advisorId: "adv-002", date: "2026-03-10", amount: 1870, reason: "Op code requires pre-auth over 3.0 flat rate hours — not submitted",        category: "preauth",   make: "Subaru",    model: "Outback"   },
  { id: "rej-008", roId: "RO-2763", advisorId: "adv-007", date: "2026-03-08", amount: 650,  reason: "Duplicate claim — same repair submitted within 30-day window",               category: "duplicate", make: "Toyota",    model: "Corolla"   },
  { id: "rej-009", roId: "RO-2758", advisorId: "adv-005", date: "2026-03-06", amount: 1120, reason: "Cause section missing — no diagnostic finding documented",                   category: "narrative", make: "Ford",      model: "Explorer"  },
  { id: "rej-010", roId: "RO-2751", advisorId: "adv-007", date: "2026-03-04", amount: 430,  reason: "Incorrect part number — superseded part listed instead of current OEM part", category: "parts",     make: "Honda",     model: "Accord"    },
];

// ── Tech Job Queue ─────────────────────────────────────────────────────────────
export const OEM_TECH_JOBS = [
  {
    id: "job-001", roId: "RO-3001",
    vin: "1GCPWDED8KZ246810",
    year: 2019, make: "Chevrolet", model: "Silverado 1500",
    customer: "Robert Chen",
    concern: "Oil low 1qt/1k mi, CEL on, oil pressure light flicker",
    dtcs: ["P0521", "P0014", "P0008"],
    bay: "Bay 4", status: "In Diagnosis",
    tsbs: [
      { number: "PIP5622E", title: "Excessive Engine Oil Consumption — AFM/DOD Lifter Collapse", confidence: 97 },
      { number: "PIP5739",  title: "Engine Oil Pressure Low / MIL — P0521",                    confidence: 84 },
    ],
    isWarranty: true, suggestedOpCode: "J4301",
  },
  {
    id: "job-002", roId: "RO-3004",
    vin: "JTMN1RFV0KD468260",
    year: 2019, make: "Toyota", model: "RAV4",
    customer: "Michael Torres",
    concern: "Rough idle cold start <40F, vibration, CEL misfire codes",
    dtcs: ["P0300", "P0301", "P0171"],
    bay: "Bay 7", status: "Repair In Progress",
    tsbs: [
      { number: "T-SB-0131-19", title: "Rough Engine Idle — Carbon Buildup on Intake Valves", confidence: 95 },
      { number: "T-SB-0053-20", title: "MIL ON P0300/P0301 — Misfire on Cold Start",          confidence: 91 },
    ],
    isWarranty: true, suggestedOpCode: "1250344",
  },
  {
    id: "job-003", roId: "RO-3005",
    vin: "1FTFW1E52LFA579371",
    year: 2020, make: "Ford", model: "F-150",
    customer: "James Patterson",
    concern: "Trans shudder 30-45mph light throttle, no CEL",
    dtcs: ["P0741", "P07D5"],
    bay: "Bay 2", status: "In Diagnosis",
    tsbs: [
      { number: "19-2346",   title: "10R80 Transmission Shudder — Fluid Exchange",        confidence: 97 },
      { number: "SSM 49537", title: "10R80 Shudder 25–50 MPH — Torque Converter Clutch",  confidence: 89 },
    ],
    isWarranty: true, suggestedOpCode: "307B08A",
  },
  {
    id: "job-004", roId: "RO-3007",
    vin: "5J6RW2H89JL791593",
    year: 2018, make: "Honda", model: "CR-V",
    customer: "Kevin Nakamura",
    concern: "Gas smell vents, oil above max, smells like fuel",
    dtcs: [],
    bay: "Bay 9", status: "In Diagnosis",
    tsbs: [
      { number: "19-079",  title: "Engine Oil Dilution — Cold Climate Operation",         confidence: 98 },
      { number: "A19-010", title: "Oil Level Increasing / Gasoline Odor — L15B Turbo",   confidence: 94 },
    ],
    isWarranty: true, suggestedOpCode: "6N200-005",
  },
];

// ── Parts (multi-make) ────────────────────────────────────────────────────────
export const OEM_PARTS = [
  // GM
  { partNo: "12643752",      description: "Lifter Kit, Non-AFM Replacement (all cylinders) — L84/L86",    dealerNet: 420.00, msrp: 680.00, coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: true,  supersededBy: null,          fitment: "2019–2022 Silverado/Sierra 5.3L/6.2L" },
  { partNo: "12673242",      description: "Gasket, Lifter Valley Cover — L84/L86/L87",                    dealerNet: 28.00,  msrp: 52.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2019–2022 GMT1XX Trucks" },
  { partNo: "42748808",      description: "Pump Assembly, Low Pressure Fuel — LYX 1.5T (Recall 20V-419)",dealerNet: 0,      msrp: 0,      coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2018–2021 Equinox/Terrain 1.5T — Recall Part" },
  // Toyota
  { partNo: "90919-02244",   description: "Coil Assembly, Ignition (All Cylinders)",                      dealerNet: 48.50,  msrp: 89.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2018–2024 Camry 2.5L" },
  { partNo: "22641-31010",   description: "Sensor, Air Fuel Ratio (Bank 1 Sensor 1)",                     dealerNet: 198.00, msrp: 324.00, coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2019–2024 RAV4, Camry" },
  { partNo: "23221-25030",   description: "Pump Assembly, Fuel (Low Pressure — Recall 20V-418)",          dealerNet: 0,      msrp: 0,      coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: "23221-25020", fitment: "2018–2021 Camry/Avalon 2.5L — Recall Part" },
  { partNo: "00289-1EC00",   description: "Top Engine Cleaner — Intake Valve Carbon (Toyota Genuine)",    dealerNet: 14.00,  msrp: 24.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "All Toyota GDI engines" },
  // Ford
  { partNo: "HB5Z-9450-A",   description: "Gasket, Exhaust Manifold (Rear — Recall 19S32)",               dealerNet: 38.00,  msrp: 68.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2011–2019 Explorer — Recall Part" },
  { partNo: "LB5Z-7801812-A",description: "Seal Kit, Body — Exhaust Path (Recall 19S32)",                 dealerNet: 22.00,  msrp: 42.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2011–2019 Explorer — Recall Part" },
  { partNo: "XT-10-QLVC",    description: "Motorcraft MERCON ULV ATF (1 quart) — 10R80",                  dealerNet: 18.00,  msrp: 28.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "2017–2022 F-150/Mustang 10R80" },
  // Honda
  { partNo: "15400-PLM-A01", description: "Filter, Oil (Honda Genuine)",                                  dealerNet: 6.50,   msrp: 12.00,  coreCharge: 0,    warrantyEligible: false, requiresPreAuth: false, supersededBy: null,          fitment: "2017–2022 CR-V/Accord/Civic 1.5T" },
  { partNo: "08798-9035",    description: "Oil, Motor 0W-20 Honda Genuine (1 quart)",                     dealerNet: 8.00,   msrp: 14.00,  coreCharge: 0,    warrantyEligible: false, requiresPreAuth: false, supersededBy: null,          fitment: "All Honda 1.5T / 2.0T engines" },
  // Subaru
  { partNo: "SOA427V1700",   description: "Fluid, Subaru CVT HCF-2 (1 quart)",                            dealerNet: 12.00,  msrp: 20.00,  coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: false, supersededBy: null,          fitment: "All Subaru Lineartronic CVT 2014+" },
  { partNo: "12033AA410",    description: "Ring Set, Piston — FB25/FB20 Engine",                          dealerNet: 180.00, msrp: 295.00, coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: true,  supersededBy: null,          fitment: "2015–2021 Outback/Legacy/Forester 2.5L" },
  { partNo: "12100AJ950",    description: "Assembly, Engine Short Block — FB25",                          dealerNet: 1840.00,msrp: 3200.00,coreCharge: 0,    warrantyEligible: true,  requiresPreAuth: true,  supersededBy: null,          fitment: "2015–2021 Outback/Legacy/Forester 2.5L" },
];

// ── Dealer Group ──────────────────────────────────────────────────────────────
export const OEM_DEALER_GROUP = [
  { id: "dl-001", name: "Palo Alto Toyota",     city: "Palo Alto, CA",    makes: ["Toyota"],              bays: 22, dms: "CDK",                 approvalRate: 86, complianceScore: 84, rosToday: 47, dollarSubmitted: 84200,  status: "warning"  },
  { id: "dl-002", name: "San Jose Toyota",      city: "San Jose, CA",     makes: ["Toyota"],              bays: 18, dms: "CDK",                 approvalRate: 93, complianceScore: 91, rosToday: 61, dollarSubmitted: 102400, status: "good"     },
  { id: "dl-003", name: "Fremont Ford",         city: "Fremont, CA",      makes: ["Ford"],                bays: 30, dms: "Reynolds & Reynolds", approvalRate: 88, complianceScore: 87, rosToday: 78, dollarSubmitted: 134800, status: "good"     },
  { id: "dl-004", name: "Oakland Honda",        city: "Oakland, CA",      makes: ["Honda"],               bays: 15, dms: "Dealertrack",         approvalRate: 71, complianceScore: 68, rosToday: 32, dollarSubmitted: 52100,  status: "critical" },
  { id: "dl-005", name: "Walnut Creek Toyota",  city: "Walnut Creek, CA", makes: ["Toyota"],              bays: 20, dms: "CDK",                 approvalRate: 90, complianceScore: 89, rosToday: 53, dollarSubmitted: 91200,  status: "good"     },
  { id: "dl-006", name: "San Francisco Chevy",  city: "San Francisco, CA",makes: ["Chevrolet", "GMC"],   bays: 25, dms: "CDK",                 approvalRate: 82, complianceScore: 79, rosToday: 58, dollarSubmitted: 98700,  status: "warning"  },
  { id: "dl-007", name: "Burlingame Honda",     city: "Burlingame, CA",   makes: ["Honda"],               bays: 16, dms: "Reynolds & Reynolds", approvalRate: 91, complianceScore: 90, rosToday: 44, dollarSubmitted: 74300,  status: "good"     },
  { id: "dl-008", name: "Pleasanton Ford",      city: "Pleasanton, CA",   makes: ["Ford", "Lincoln"],     bays: 28, dms: "Dealertrack",         approvalRate: 85, complianceScore: 83, rosToday: 67, dollarSubmitted: 115600, status: "good"     },
];
