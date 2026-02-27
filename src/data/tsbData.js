// ============================================================
// Technical Service Bulletins — Demo Data
// NHTSA doesn't have a clean TSB API, so we use curated data
// ============================================================

export const tsbDatabase = [
  // ── Toyota Camry 2021 ────────────────────────────────────
  {
    bulletinNumber: "TSB-0077-21",
    make: "Toyota",
    model: "Camry",
    yearStart: 2018,
    yearEnd: 2023,
    component: "Engine",
    system: "Lubrication",
    title: "Excessive Engine Oil Consumption — 2.5L Dynamic Force (A25A-FKS)",
    description: "Some vehicles may exhibit higher than normal oil consumption. Root cause is piston ring design allowing oil past rings under certain driving conditions (frequent short trips, extended idle). Oil consumption exceeding 1qt per 1,200 miles warrants further diagnosis.",
    laborHours: 1.0,
    laborNote: "Oil consumption test: 1.0 hr initial + 0.5 hr follow-up at 1,200 miles",
    partsNeeded: ["Engine oil 0W-20 (6qt)", "Oil filter"],
    partsEstimate: 65,
    severity: "moderate",
    affectedVins: "4T1B11HK*MU000001 — 4T1B11HK*MU999999",
    publishDate: "2021-08-15",
  },
  {
    bulletinNumber: "TSB-0194-21",
    make: "Toyota",
    model: "Camry",
    yearStart: 2021,
    yearEnd: 2022,
    component: "Electrical",
    system: "Infotainment",
    title: "Audio/Display System Spontaneous Reboot",
    description: "Head unit may intermittently reboot while driving. Display goes black for 5-10 seconds then restarts. Caused by software conflict with Apple CarPlay/Android Auto when Bluetooth and USB are connected simultaneously. Software update resolves the issue.",
    laborHours: 0.5,
    laborNote: "Software update via USB — reprogram head unit",
    partsNeeded: ["USB drive with firmware update T-SB-0194-21-SW"],
    partsEstimate: 0,
    severity: "low",
    affectedVins: "4T1B11HK*MU100001 — 4T1B11HK*MU400000",
    publishDate: "2021-11-22",
  },

  // ── Honda CR-V 2019 ──────────────────────────────────────
  {
    bulletinNumber: "TSB-19-052",
    make: "Honda",
    model: "CR-V",
    yearStart: 2017,
    yearEnd: 2020,
    component: "Engine",
    system: "Fuel / Lubrication",
    title: "1.5L Turbo Engine Oil Dilution by Fuel",
    description: "The 1.5L turbocharged engine (L15BE) may exhibit fuel dilution of engine oil, especially in cold climates or with frequent short trips. Oil level rises above full mark and smells of gasoline. Honda issued an extended warranty (6yr/80K miles) for engine and transmission related to this issue. Software update adjusts fuel injection timing and raises engine operating temperature.",
    laborHours: 1.0,
    laborNote: "ECU reprogram + oil/filter change + inspection",
    partsNeeded: ["Engine oil 0W-20 (4qt)", "Oil filter", "Software update via HDS"],
    partsEstimate: 55,
    severity: "high",
    affectedVins: "5J6RW2H8*KA000001 — 5J6RW2H8*LA999999",
    publishDate: "2019-10-04",
    extendedWarranty: { years: 6, miles: 80000, note: "Engine & transmission coverage" },
  },
  {
    bulletinNumber: "TSB-20-009",
    make: "Honda",
    model: "CR-V",
    yearStart: 2017,
    yearEnd: 2021,
    component: "HVAC",
    system: "Air Conditioning",
    title: "AC Condenser Leak — Premature Failure",
    description: "AC condenser may develop a refrigerant leak at the sub-cool section (lower portion). Caused by road debris impact on thin condenser fins. Symptoms: reduced cooling, AC compressor cycling, warm air from vents. Honda extended coverage for condenser replacement.",
    laborHours: 2.5,
    laborNote: "Condenser replacement + evacuate/recharge system",
    partsNeeded: ["AC Condenser assembly", "Refrigerant R-134a (1.5 lbs)", "O-rings kit", "Receiver/dryer"],
    partsEstimate: 380,
    severity: "moderate",
    affectedVins: "5J6RW2H8*HA000001 — 5J6RW2H8*MA999999",
    publishDate: "2020-03-18",
  },

  // ── BMW X3 2020 ──────────────────────────────────────────
  {
    bulletinNumber: "SIB-34-16-20",
    make: "BMW",
    model: "X3",
    yearStart: 2018,
    yearEnd: 2021,
    component: "Brakes",
    system: "Front Brakes",
    title: "Front Brake Vibration / Pulsation at 60-65K Miles",
    description: "Front brake rotors may develop uneven wear (lateral runout > 0.003\") causing steering wheel vibration during braking at highway speeds. Common on vehicles driven in hilly terrain (Bay Area). Requires rotor replacement — resurfacing typically insufficient due to minimum thickness specifications.",
    laborHours: 2.0,
    laborNote: "Replace front rotors + pads, includes brake fluid flush",
    partsNeeded: ["Front brake rotors OEM (2)", "Front brake pads OEM", "Brake wear sensors (2)", "Brake fluid DOT 4 (1L)"],
    partsEstimate: 742,
    severity: "moderate",
    affectedVins: "5UX43DP0*LL000001 — 5UX43DP0*ML999999",
    publishDate: "2020-09-12",
  },
  {
    bulletinNumber: "SIB-11-06-20",
    make: "BMW",
    model: "X3",
    yearStart: 2019,
    yearEnd: 2021,
    component: "Engine",
    system: "Timing / Valvetrain",
    title: "B48 Engine — Timing Chain Stretch at High Mileage",
    description: "The B48 2.0L turbocharged engine may exhibit timing chain elongation beyond 80K miles, triggering fault codes 2A87 or 2A88 (camshaft timing). Symptoms include rough idle, reduced power, and check engine light. Early detection via oil analysis (elevated iron content) can prevent catastrophic engine damage.",
    laborHours: 8.0,
    laborNote: "Timing chain kit replacement — engine must be partially disassembled",
    partsNeeded: ["Timing chain kit (chain, guides, tensioner)", "VANOS solenoids (2)", "Valve cover gasket", "Engine oil 0W-20 LL-17 (6L)"],
    partsEstimate: 1250,
    severity: "high",
    affectedVins: "5UX43DP0*KL000001 — 5UX43DP0*ML999999",
    publishDate: "2020-06-28",
  },

  // ── Ford F-150 2022 ──────────────────────────────────────
  {
    bulletinNumber: "TSB-22-2346",
    make: "Ford",
    model: "F-150",
    yearStart: 2021,
    yearEnd: 2023,
    component: "Engine",
    system: "Valvetrain",
    title: "5.0L Coyote V8 — Cam Phaser Tick / Rattle on Cold Start",
    description: "A ticking or rattling noise may be heard from the engine for 1-3 seconds during cold start. Caused by cam phaser hydraulic lash adjuster bleed-down during extended parking. Ford considers this normal operation if noise resolves within 3 seconds. If persistent (>5 seconds), cam phaser replacement may be required.",
    laborHours: 6.0,
    laborNote: "Cam phaser replacement (if warranted) — timing cover removal required",
    partsNeeded: ["Cam phasers (4)", "Timing chain set", "VCT solenoids (4)", "Front cover gasket set"],
    partsEstimate: 890,
    severity: "low",
    affectedVins: "1FTFW1E5*NF000001 — 1FTFW1E5*PF999999",
    publishDate: "2022-11-08",
    note: "Document noise duration. <3 seconds = normal. >5 seconds = warranty claim eligible.",
  },
  {
    bulletinNumber: "TSB-22-2089",
    make: "Ford",
    model: "F-150",
    yearStart: 2021,
    yearEnd: 2023,
    component: "Transmission",
    system: "10R80 Automatic",
    title: "10R80 — Harsh 3-4 Upshift / Delayed Engagement",
    description: "The 10-speed 10R80 automatic transmission may exhibit firm/harsh 3-4 upshift or 1-2 second delay when shifting from Park to Drive/Reverse. Caused by adaptive learning drift in TCM. Resolved by performing adaptive learning reset and updating TCM software to latest calibration.",
    laborHours: 1.5,
    laborNote: "TCM reprogram via FDRS + adaptive learning reset + road test",
    partsNeeded: ["None — software update only"],
    partsEstimate: 0,
    severity: "moderate",
    affectedVins: "1FTFW1E5*NF000001 — 1FTFW1E5*PF999999",
    publishDate: "2022-07-15",
  },

  // ── Subaru Outback 2018 ──────────────────────────────────
  {
    bulletinNumber: "TSB-02-174-18R",
    make: "Subaru",
    model: "Outback",
    yearStart: 2015,
    yearEnd: 2019,
    component: "Engine",
    system: "Cooling / Gaskets",
    title: "FB25 Engine — Head Gasket External Coolant Leak",
    description: "The FB25 2.5L Boxer engine may develop an external coolant leak at the cylinder head gasket, typically between 80K-110K miles. Leak manifests as weeping coolant on the engine block exterior, often noticed as a sweet smell or low coolant warnings. Unlike the older EJ25 internal leak pattern, the FB25 leak is usually external. Early detection prevents costly engine damage.",
    laborHours: 12.0,
    laborNote: "Both head gaskets should be replaced simultaneously. Includes timing chain service.",
    partsNeeded: ["Head gaskets (2)", "Head bolts (new — TTY)", "Timing chain service kit", "Thermostat", "Water pump", "Coolant (2 gal)", "Valve cover gaskets (2)"],
    partsEstimate: 650,
    severity: "high",
    affectedVins: "4S4BSACC*J3000001 — 4S4BSACC*K3999999",
    publishDate: "2018-12-04",
    note: "Total repair estimate with labor: $2,800-$3,400. Discuss cost vs. vehicle value with customer.",
  },
  {
    bulletinNumber: "TSB-11-212-18R",
    make: "Subaru",
    model: "Outback",
    yearStart: 2015,
    yearEnd: 2019,
    component: "Transmission",
    system: "CVT (Lineartronic)",
    title: "CVT — Judder / Shudder During Low-Speed Acceleration",
    description: "CVT may exhibit a judder or shudder sensation during low-speed acceleration (10-25 mph), similar to a torque converter shudder. Caused by CVT fluid degradation or contamination of the torque converter lock-up clutch. Resolved by CVT fluid drain/fill with Subaru CVT Fluid (SOA868V9245). If judder persists after fluid change, valve body replacement may be needed.",
    laborHours: 1.5,
    laborNote: "CVT fluid drain and fill (not flush). If persists: valve body replacement (5.0 hrs)",
    partsNeeded: ["Subaru CVT Fluid (5qt)", "CVT drain plug gasket"],
    partsEstimate: 85,
    severity: "moderate",
    affectedVins: "4S4BSACC*F3000001 — 4S4BSACC*K3999999",
    publishDate: "2018-09-20",
  },

  // ── Toyota RAV4 2020 ─────────────────────────────────────
  {
    bulletinNumber: "TSB-0035-20",
    make: "Toyota",
    model: "RAV4",
    yearStart: 2019,
    yearEnd: 2021,
    component: "Transmission",
    system: "8-Speed Direct-Shift",
    title: "Harsh Downshift 3rd to 2nd Under Light Braking",
    description: "Some vehicles may exhibit a firm or harsh downshift from 3rd to 2nd gear during light braking at low speeds (15-25 mph). ECU recalibration adjusts shift timing and torque converter slip parameters. No parts replacement needed.",
    laborHours: 0.5,
    laborNote: "ECU recalibration via Techstream",
    partsNeeded: ["None — software update only"],
    partsEstimate: 0,
    severity: "low",
    affectedVins: "2T3P1RFV*LW000001 — 2T3P1RFV*MW999999",
    publishDate: "2020-05-11",
  },
];

// ── Recall Data (supplement live NHTSA API) ────────────────
export const recallData = [
  {
    nhtsaCampaignNumber: "23V865000",
    make: "Toyota",
    model: "Camry",
    yearStart: 2018,
    yearEnd: 2021,
    component: "Air Bags: Sensor: Occupant Classification",
    summary: "The occupant classification system (OCS) sensor mat in the front passenger seat may malfunction, potentially disabling the front passenger air bag.",
    consequence: "If the OCS does not correctly detect the front passenger, the air bag may not deploy in a crash, increasing the risk of injury.",
    remedy: "Dealers will replace the OCS ECU and sensor mat. Dealer repair required — no independent shop repair available.",
    reportDate: "2023-12-20",
    parkIt: false,
  },
  {
    nhtsaCampaignNumber: "22V879000",
    make: "Hyundai",
    model: "Tucson",
    yearStart: 2022,
    yearEnd: 2023,
    component: "Electrical System: Software",
    summary: "The Integrated Electronic Brake (IEB) system software may have a logic error that could cause unintended braking.",
    consequence: "Unexpected braking could increase the risk of a crash.",
    remedy: "Dealers will update the IEB software free of charge.",
    reportDate: "2022-11-15",
    parkIt: false,
  },
];

// ── Helper functions ───────────────────────────────────────
export function getTSBsForVehicle(make, model, year) {
  return tsbDatabase.filter(
    (tsb) =>
      tsb.make.toLowerCase() === make.toLowerCase() &&
      tsb.model.toLowerCase() === model.toLowerCase() &&
      year >= tsb.yearStart &&
      year <= tsb.yearEnd
  );
}

export function getRecallsForVehicle(make, model, year) {
  return recallData.filter(
    (r) =>
      r.make.toLowerCase() === make.toLowerCase() &&
      r.model.toLowerCase() === model.toLowerCase() &&
      year >= r.yearStart &&
      year <= r.yearEnd
  );
}

export function getTSBsByComponent(component) {
  return tsbDatabase.filter((tsb) =>
    tsb.component.toLowerCase().includes(component.toLowerCase())
  );
}

export function getHighSeverityTSBs() {
  return tsbDatabase.filter((tsb) => tsb.severity === "high");
}
