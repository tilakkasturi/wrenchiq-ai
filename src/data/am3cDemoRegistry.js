/**
 * AM 3C Demo Data Provider
 * Jira: AE-881
 *
 * Provides pre-seeded demo data for the WrenchIQ AM 3C Story Writer.
 * Active when DEMO_MODE env var is set or shop_id matches DEMO-* pattern.
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} vin
 * @property {number} year
 * @property {string} make
 * @property {string} model
 * @property {string} trim
 * @property {string} engine
 * @property {string} transmission
 * @property {string} driveType
 * @property {string} fuelType
 * @property {number} mileage
 */

/**
 * @typedef {Object} RepairOrder
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {string} concern
 * @property {string} defaultComplaint
 * @property {string} status
 */

/**
 * @typedef {Object} DVIFinding
 * @property {string} id
 * @property {string} item
 * @property {'green'|'yellow'|'red'} status
 * @property {string} techNote
 * @property {string} [measurement]
 * @property {string} [oemSpec]
 * @property {string} [photoRef]
 * @property {boolean} [actioned]
 */

/**
 * @typedef {Object} TSBMatch
 * @property {string} tsbNumber
 * @property {string} title
 * @property {string} affectedCondition
 * @property {number} relevanceScore
 * @property {string} source
 */

/**
 * @typedef {Object} FreezeFrame
 * @property {number} [rpm]
 * @property {string} [load]
 * @property {string} [coolantTemp]
 * @property {number} [speed]
 * @property {string} [fuelTrim]
 */

/**
 * @typedef {Object} DTCResult
 * @property {string} code
 * @property {string} description
 * @property {string} system
 * @property {'low'|'medium'|'high'} severity
 * @property {'confirmed'|'pending'|'historical'} status
 * @property {FreezeFrame} [freezeFrame]
 */

/**
 * @typedef {Object} ClassifiedNote
 * @property {string} text
 * @property {'complaint'|'cause'|'correction'|'recommendation'} section
 * @property {number} confidence
 * @property {'auto'|'review'|'flagged'} status
 */

/**
 * @typedef {Object} DemoEntry
 * @property {Vehicle} vehicle
 * @property {RepairOrder} ro
 * @property {DVIFinding[]} dviFindings
 * @property {TSBMatch[]} tsbMatches
 * @property {DTCResult[]} dtcCodes
 * @property {string} techNotes
 * @property {number} prediiScore
 * @property {ClassifiedNote[]} classifiedNotes
 */

/**
 * @type {Object.<string, DemoEntry>}
 */
export const DEMO_REGISTRY = {

  // 1 — 2019 Toyota Camry SE — P0420 catalytic converter
  '4T1B11HK6KU123456': {
    vehicle: {
      vin: '4T1B11HK6KU123456',
      year: 2019,
      make: 'Toyota',
      model: 'Camry',
      trim: 'SE',
      engine: '2.5L I4 DOHC',
      transmission: '8-Speed Automatic',
      driveType: 'FWD',
      fuelType: 'Gasoline',
      mileage: 68420,
    },
    ro: {
      id: 'RO-2401',
      customerId: 'CUST-1101',
      customerName: 'Marcus Webb',
      concern: 'Check engine light on. Vehicle passed smog last year but failed this year.',
      defaultComplaint: "My check engine light came on about three weeks ago. The car drives fine, no rough idle or hesitation, but it just failed smog — the tech said it was a P0420 code.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2401-01',
        item: 'Engine Air Filter',
        status: 'yellow',
        techNote: 'Filter heavily soiled with dust and debris at 68,420 miles. Original filter — well past 30k service interval.',
        measurement: 'Visual — blocked >40% of pleats',
        oemSpec: 'Replace every 30,000 miles',
      },
      {
        id: 'dvi-2401-02',
        item: 'Catalytic Converter Bank 1',
        status: 'red',
        techNote: 'Post-cat O2 waveform identical to pre-cat. Catalyst conversion efficiency confirmed below threshold. P0420 confirmed.',
        measurement: 'Post-cat O2 switching 0.3–0.7V (mirrors pre-cat)',
        oemSpec: 'Post-cat O2 should hold steady ~0.55–0.65V',
        photoRef: 'photo-2401-o2-waveform.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2401-03',
        item: 'Brake Fluid',
        status: 'yellow',
        techNote: 'Moisture content at 3.2%, slightly above 3% replacement threshold. Brake pedal feel normal.',
        measurement: '3.2% moisture',
        oemSpec: 'Replace when >3.0%',
      },
      {
        id: 'dvi-2401-04',
        item: 'Tire Tread Depth',
        status: 'green',
        techNote: 'All four tires acceptable.',
        measurement: 'FL:7/32 FR:7/32 RL:6/32 RR:6/32',
        oemSpec: 'Minimum 2/32',
      },
      {
        id: 'dvi-2401-05',
        item: 'Engine Coolant',
        status: 'green',
        techNote: 'Level at full cold mark, color normal pink, no contamination.',
      },
      {
        id: 'dvi-2401-06',
        item: 'Cabin Air Filter',
        status: 'yellow',
        techNote: 'Debris accumulation visible. Customer declined replacement today.',
        measurement: 'Visual — moderate debris',
        oemSpec: 'Replace every 15,000–25,000 miles',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: 'T-SB-0197-18',
        title: 'P0420 — Catalyst System Efficiency Below Threshold Bank 1',
        affectedCondition: 'MIL illuminated with P0420; vehicle exhibits no drivability symptoms; condition occurs at steady-state cruise above 25 mph after full warm-up',
        relevanceScore: 0.97,
        source: 'Toyota Technical Information System',
      },
      {
        tsbNumber: 'T-SB-0085-19',
        title: 'Fuel Injector Deposit Buildup — Lean Codes and Hesitation on 2.5L I4 DOHC',
        affectedCondition: 'Fuel injector deposit accumulation above 60,000 miles may accelerate catalyst degradation; may present alongside P0420',
        relevanceScore: 0.61,
        source: 'Toyota Technical Information System',
      },
    ],
    dtcCodes: [
      {
        code: 'P0420',
        description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
        system: 'powertrain',
        severity: 'high',
        status: 'confirmed',
        freezeFrame: {
          rpm: 1850,
          load: '42%',
          coolantTemp: '196°F',
          speed: 38,
          fuelTrim: 'STFT +2.3% / LTFT -0.8%',
        },
      },
    ],
    techNotes: `Customer states CEL on ~3 weeks, no drivability complaint. Failed OBD-II emissions test at smog station — P0420 flagged.

Scan: Active DTC P0420 Bank 1. No additional codes. Cleared and performed 2x warm-up drive cycles — P0420 resets within 8 miles.

Pre-cat (A/F sensor): rich-lean switching pattern normal, response time 180ms. Post-cat O2 (sensor 2): waveform mirrors pre-cat almost identically — switching at 0.3V–0.7V range. Expected post-cat waveform should be flat ~0.6V. Confirms catalyst has lost light-off and conversion efficiency.

No exhaust leaks upstream of sensors. Exhaust manifold and flex pipe sealing good — no soot traces. Coolant level normal, no hydrocarbon in coolant (combustion check negative). Fuel trim: STFT +2.3% LTFT -0.8% — within normal range, rules out lean condition masking catalyst issue.

Per TSB T-SB-0197-18: replacement of Bank 1 catalytic converter recommended. Engine air filter also due (68k miles, visually dirty). Recommend fuel injector cleaning as maintenance item.`,
    prediiScore: 94,
    classifiedNotes: [
      {
        text: 'Customer states check engine light on for approximately 3 weeks with no drivability issues. Vehicle failed OBD-II emissions test at smog station — P0420 code flagged by smog tech.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'Post-cat O2 sensor waveform mirrors pre-cat sensor waveform identically, confirming catalyst conversion efficiency below OEM threshold. No exhaust leaks found upstream of sensors. Fuel trims within normal range — lean condition ruled out as masking factor.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Replace catalytic converter Bank 1 per TSB T-SB-0197-18. Perform fuel injector cleaning. Replace engine air filter — original at 68,420 miles.',
        section: 'correction',
        confidence: 0.96,
        status: 'auto',
      },
      {
        text: 'Flush brake fluid at next oil service — moisture content at 3.2%, above 3% replacement threshold. Customer declined cabin air filter today — add to next visit.',
        section: 'recommendation',
        confidence: 0.91,
        status: 'auto',
      },
    ],
  },

  // 2 — 2021 Honda CR-V EX AWD — A/C condenser UV dye leak
  '5J6RW2H59MA234567': {
    vehicle: {
      vin: '5J6RW2H59MA234567',
      year: 2021,
      make: 'Honda',
      model: 'CR-V',
      trim: 'EX AWD',
      engine: '1.5L Turbocharged I4',
      transmission: 'CVT',
      driveType: 'AWD',
      fuelType: 'Gasoline',
      mileage: 34870,
    },
    ro: {
      id: 'RO-2402',
      customerId: 'CUST-1102',
      customerName: 'Priya Nair',
      concern: 'A/C stopped blowing cold last week. Husband says he saw a puddle under the front of the car.',
      defaultComplaint: "My air conditioning completely stopped working about a week ago. My husband noticed a small puddle under the front of the car when we parked in the garage — not sure if it's related.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2402-01',
        item: 'A/C Condenser',
        status: 'red',
        techNote: 'UV dye leak confirmed at lower-left corner of condenser face. Impact deformation visible on fins. System critically undercharged at 5 psi low-side.',
        measurement: 'Low-side: 5 psi | High-side: 45 psi',
        oemSpec: 'Low-side: 25–35 psi | High-side: 200–250 psi',
        photoRef: 'photo-2402-condenser-uv.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2402-02',
        item: 'Cabin Air Filter',
        status: 'red',
        techNote: 'Filter severely blocked — 70%+ debris coverage. Restricts airflow through evaporator, accelerates recirculation buildup.',
        measurement: 'Visual — 70% blocked',
        oemSpec: 'Replace every 15,000–20,000 miles or when blocked',
        actioned: true,
      },
      {
        id: 'dvi-2402-03',
        item: 'Tire Tread Depth',
        status: 'green',
        techNote: 'All four tires good.',
        measurement: 'FL:8/32 FR:8/32 RL:7/32 RR:7/32',
      },
      {
        id: 'dvi-2402-04',
        item: 'Engine Oil',
        status: 'green',
        techNote: 'Level at full, color normal dark brown. Recent oil change sticker visible — 4,200 miles since last change.',
      },
      {
        id: 'dvi-2402-05',
        item: 'Brake Pads Front',
        status: 'yellow',
        techNote: 'Front pads at 4mm. Service life remaining ~15,000 miles.',
        measurement: 'LF: 4mm | RF: 4mm',
        oemSpec: 'Replace at 3mm',
      },
      {
        id: 'dvi-2402-06',
        item: 'Windshield Washer Fluid',
        status: 'yellow',
        techNote: 'Low — below minimum mark.',
        measurement: 'Visual — below MIN line',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: '21-051',
        title: 'A/C Condenser Refrigerant Leak — Road Debris Impact',
        affectedCondition: '2020–2022 CR-V: A/C condenser develops refrigerant leak from road debris impact at lower condenser face; UV dye visible at condenser seams',
        relevanceScore: 0.96,
        source: 'Honda Service News',
      },
      {
        tsbNumber: '21-038',
        title: 'A/C System Recharge Procedure and Refrigerant Capacity Update',
        affectedCondition: 'Use 14.8 oz R-134a capacity for 2021 CR-V EX AWD after condenser replacement',
        relevanceScore: 0.78,
        source: 'Honda Service News',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states A/C inoperative — blows ambient air. Husband observed drip under front of vehicle in garage overnight.

Performance check: compressor cycles on 1–2 seconds then shuts off. Low-side pressure: 5 psi (should be 25–35 psi loaded). System critically undercharged. High-side: 45 psi (should be 200–250 psi). Confirmed refrigerant loss.

UV dye inspection (UV lamp): heavy dye concentration on forward face of A/C condenser — lower left corner, consistent with stone impact or vibration crack. Condenser fins show impact deformation in same area. Dye streaking down subframe confirms this is primary leak point.

No dye at compressor shaft seal, TXV, or evaporator connections. Hose fittings dry. Isolated leak to condenser only.

Per Honda Service News 21-051: A/C condenser replacement recommended for 2021 CR-V with refrigerant loss. Recharge with 14.8 oz R-134a per spec. Suggest cabin air filter replacement — significant debris accumulation (70% blocked).

Note: 2021 CR-V has known condenser vulnerability to road debris per multiple NHTSA complaints (ODI #11477849 pattern). Document for customer records.`,
    prediiScore: 91,
    classifiedNotes: [
      {
        text: 'Customer reports A/C completely inoperative for approximately one week. Husband observed fluid puddle under front of vehicle in garage overnight.',
        section: 'complaint',
        confidence: 0.97,
        status: 'auto',
      },
      {
        text: 'System critically undercharged — low-side pressure 5 psi against spec of 25–35 psi. UV dye inspection confirms refrigerant leak at lower-left corner of A/C condenser with visible fin impact deformation. Compressor shuts off on low-pressure cutout after 1–2 seconds.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Replace A/C condenser per Honda Service News 21-051. Evacuate and recharge system with 14.8 oz R-134a to specification. Replace severely blocked cabin air filter.',
        section: 'correction',
        confidence: 0.93,
        status: 'auto',
      },
      {
        text: 'Front brake pads at 4mm — schedule replacement within 15,000 miles. Top off windshield washer fluid. Document condenser failure per NHTSA complaint pattern ODI #11477849.',
        section: 'recommendation',
        confidence: 0.91,
        status: 'auto',
      },
    ],
  },

  // 3 — 2018 Ford F-150 XLT 5.0L V8 — Cylinder 3 misfire P0303
  '1FTFW1E54JKC345678': {
    vehicle: {
      vin: '1FTFW1E54JKC345678',
      year: 2018,
      make: 'Ford',
      model: 'F-150',
      trim: 'XLT',
      engine: '5.0L V8 Ti-VCT',
      transmission: '10-Speed Automatic',
      driveType: '4WD',
      fuelType: 'Gasoline',
      mileage: 89240,
    },
    ro: {
      id: 'RO-2403',
      customerId: 'CUST-1103',
      customerName: 'Derek Fontaine',
      concern: 'Rough idle and misfire. Shakes at stoplights. Check engine light flashing on the highway.',
      defaultComplaint: "The truck has been shaking badly at idle for about two weeks. The check engine light was flashing when I was on the highway, which scared me, so I pulled over. It's also gotten worse in cold weather.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2403-01',
        item: 'Spark Plugs (All 8)',
        status: 'red',
        techNote: 'All 8 spark plugs significantly worn — electrode gap 0.048–0.065 inches (spec 0.032–0.036 inches). Cylinder 3 plug confirmed misfire source via isolation test.',
        measurement: 'Cyl 3: 0.065" | Others: 0.048–0.055"',
        oemSpec: 'Replace at 60,000 miles; gap spec 0.032–0.036"',
        actioned: true,
      },
      {
        id: 'dvi-2403-02',
        item: 'Engine Air Filter',
        status: 'yellow',
        techNote: 'Filter moderately dirty. Recommend replacement at next service.',
        measurement: 'Visual — moderate dust loading',
        oemSpec: 'Replace every 30,000 miles',
      },
      {
        id: 'dvi-2403-03',
        item: 'Coolant Level',
        status: 'green',
        techNote: 'Coolant at full cold mark. Color normal yellow-green. No contamination.',
      },
      {
        id: 'dvi-2403-04',
        item: 'Belt Condition',
        status: 'green',
        techNote: 'Serpentine belt shows normal wear, no cracking or fraying.',
        measurement: 'Visual — no cracks',
      },
      {
        id: 'dvi-2403-05',
        item: 'Front Brake Pads',
        status: 'green',
        techNote: 'Pads at 7mm, good service life remaining.',
        measurement: 'LF: 7mm | RF: 7mm',
        oemSpec: 'Replace at 3mm',
      },
      {
        id: 'dvi-2403-06',
        item: 'Tire Tread Depth',
        status: 'yellow',
        techNote: 'Rear tires wearing faster than fronts — recommend rotation.',
        measurement: 'FL:7/32 FR:7/32 RL:4/32 RR:4/32',
        oemSpec: 'Rotate every 5,000–7,500 miles',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: '18-2346',
        title: '5.0L Coyote V8 — Extended Spark Plug Service Interval and P030X Misfire Diagnosis',
        affectedCondition: '2015–2019 F-150 5.0L: spark plug gap wear beyond spec causes single-cylinder misfires; P0303 most common on high-load cylinders; platinum plug replacement resolves',
        relevanceScore: 0.95,
        source: 'Ford Technical Service Bulletin',
      },
      {
        tsbNumber: '18-0175',
        title: 'MIL Illuminated — P0316 Misfire Detected on First 1,000 Revolutions Cold Start',
        affectedCondition: 'Cold-start misfires associated with worn plug gap; resolves after plug replacement',
        relevanceScore: 0.84,
        source: 'Ford Technical Service Bulletin',
      },
    ],
    dtcCodes: [
      {
        code: 'P0303',
        description: 'Cylinder 3 Misfire Detected',
        system: 'powertrain',
        severity: 'high',
        status: 'confirmed',
        freezeFrame: {
          rpm: 680,
          load: '18%',
          coolantTemp: '197°F',
          speed: 0,
          fuelTrim: 'STFT +1.2%',
        },
      },
      {
        code: 'P0316',
        description: 'Misfire Detected on Engine Startup (First 1000 Revolutions)',
        system: 'powertrain',
        severity: 'medium',
        status: 'historical',
      },
    ],
    techNotes: `Customer states rough idle, engine shake at stoplights, flashing MIL on highway. Concern worsened in cold weather. Pulled over when MIL flashed.

Scan: Active codes P0303 (Cylinder 3 Misfire Detected — confirmed), P0316 (Misfire Detected on Startup — first 1,000 revolutions — historical). No other codes.

Live data: Cylinder 3 misfire counter climbing steadily at idle and under light load. Misfires spike above 2,000 RPM. Fuel trims: STFT Bk1 +1.2%, LTFT Bk1 -0.4% — lean condition not present.

Isolation test: killed injector on Cyl 3 — no RPM change (confirms that cylinder is already misfiring and not contributing). Swapped coil Cyl 3 → Cyl 5 — misfire did NOT follow coil to Cyl 5. Coil ruled out. Swapped plug Cyl 3 → Cyl 5 — misfire FOLLOWED plug. Confirmed: Cylinder 3 spark plug is root cause.

Removed Cyl 3 plug: gap at 0.065" (spec 0.032"–0.036"). Electrode heavily worn, side electrode erosion visible. All remaining plugs inspected — Cyls 1, 2, 4, 5, 6, 7, 8 gaps ranging 0.048"–0.055" (all beyond spec). Vehicle at 89,240 miles — original plugs.

Recommend: Replace all 8 spark plugs with Ford-spec Motorcraft SP-515 platinum. Per Ford TSB 18-2346: 5.0L Coyote V8 spark plug replacement at 60,000 miles. Vehicle is 29,000 miles overdue.`,
    prediiScore: 92,
    classifiedNotes: [
      {
        text: 'Customer states engine shaking badly at idle for two weeks, check engine light flashing on the highway causing customer to pull over. Condition worsened in cold weather.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'Plug-swap isolation test confirms Cylinder 3 spark plug as root cause — misfire followed plug to Cylinder 5. Cylinder 3 plug gap measured 0.065" against spec of 0.032–0.036". All 8 plugs original at 89,240 miles with gaps 0.048–0.065" (all out of spec). Coil and injector tested and ruled out.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Replace all 8 spark plugs with Motorcraft SP-515 platinum per Ford TSB 18-2346. Vehicle is 29,240 miles overdue for plug replacement.',
        section: 'correction',
        confidence: 0.93,
        status: 'auto',
      },
      {
        text: 'Rotate tires — rear tires at 4/32 wearing faster than fronts. Replace engine air filter at next service.',
        section: 'recommendation',
        confidence: 0.90,
        status: 'auto',
      },
    ],
  },

  // 4 — 2020 Chevrolet Silverado 1500 LT — StabiliTrak/WSS C0035
  '1GCRYDED8LZ456789': {
    vehicle: {
      vin: '1GCRYDED8LZ456789',
      year: 2020,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      trim: 'LT',
      engine: '5.3L V8 EcoTec3',
      transmission: '8-Speed Automatic',
      driveType: '4WD',
      fuelType: 'Gasoline',
      mileage: 54220,
    },
    ro: {
      id: 'RO-2404',
      customerId: 'CUST-1104',
      customerName: 'Yvonne Castellano',
      concern: 'StabiliTrak light and traction control light both on. ABS light came on yesterday. Feels like the truck pulls slightly when braking.',
      defaultComplaint: "The StabiliTrak light and traction control light came on together about two weeks ago. Then yesterday the ABS light came on too. Sometimes when I brake hard it feels like the truck pulls to the left a little.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2404-01',
        item: 'Left Front Wheel Speed Sensor/Wiring',
        status: 'red',
        techNote: 'WSS connector shows heavy corrosion on pin terminals. Wiring chafed at lower control arm. Live data confirms signal dropouts correlating with C0035 active fault.',
        measurement: 'Sensor resistance: 980Ω | Signal: intermittent dropout to 0 mph',
        oemSpec: 'Spec: 900–1100Ω; signal must be continuous',
        photoRef: 'photo-2404-wsscorrosion.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2404-02',
        item: 'Front Brake Pads',
        status: 'green',
        techNote: 'Pads at 5mm, acceptable service life remaining.',
        measurement: 'LF: 5mm | RF: 5mm',
        oemSpec: 'Replace at 3mm',
      },
      {
        id: 'dvi-2404-03',
        item: 'Front Brake Rotors',
        status: 'green',
        techNote: 'Rotors within spec, no scoring or heat discoloration.',
        measurement: 'LF: 31.2mm | RF: 31.2mm',
        oemSpec: 'Minimum 30.0mm',
      },
      {
        id: 'dvi-2404-04',
        item: 'Tire Tread Depth',
        status: 'yellow',
        techNote: 'LR tire showing faster wear, likely due to StabiliTrak malfunction period.',
        measurement: 'FL:7/32 FR:7/32 RL:4/32 RR:5/32',
      },
      {
        id: 'dvi-2404-05',
        item: 'Engine Oil Level',
        status: 'green',
        techNote: 'Level at full. Clean, no contamination.',
      },
      {
        id: 'dvi-2404-06',
        item: 'Battery',
        status: 'yellow',
        techNote: 'Load test result 82% CCA (spec >80%). Near end of service life at 4 years.',
        measurement: 'CCA tested: 492A | Rated: 600A CCA',
        oemSpec: '>80% CCA or replace',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: '22-NA-052',
        title: 'C0035 / C0040 — Front Wheel Speed Sensor Wiring Harness Corrosion and Signal Loss',
        affectedCondition: '2019–2022 Silverado 1500/Sierra 1500: moisture intrusion at LF/RF WSS connector causes intermittent signal loss; ABS/StabiliTrak deactivation; connector and harness replacement resolves',
        relevanceScore: 0.96,
        source: 'GM Technical Service Bulletin',
      },
      {
        tsbNumber: '20-NA-175',
        title: 'ABS/StabiliTrak Warning Lights — EBCM Rationality Fault After Primary WSS Signal Loss',
        affectedCondition: 'Secondary C0040 code set by EBCM self-test when primary wheel speed sensor dropout detected; clears after primary repair',
        relevanceScore: 0.81,
        source: 'GM Technical Service Bulletin',
      },
    ],
    dtcCodes: [
      {
        code: 'C0035',
        description: 'Left Front Wheel Speed Sensor Circuit',
        system: 'chassis',
        severity: 'high',
        status: 'confirmed',
        freezeFrame: {
          rpm: 820,
          load: 'N/A',
          coolantTemp: '198°F',
          speed: 0,
          fuelTrim: 'N/A',
        },
      },
      {
        code: 'C0040',
        description: 'Right Front Wheel Speed Sensor Circuit',
        system: 'chassis',
        severity: 'medium',
        status: 'pending',
      },
    ],
    techNotes: `Customer reports StabiliTrak OFF, Traction Control OFF, and ABS MIL illumination. Intermittent left pull on hard braking.

Scan: EBCM module — Active DTCs: C0035 (Left Front Wheel Speed Sensor Circuit), C0040 (Right Front Wheel Speed Sensor Circuit — historical/pending). ABS and StabiliTrak systems deactivated by EBCM per fault.

Live data wheel speed: LF sensor reading erratic — dropouts to 0 mph while vehicle moving at known speed. RF sensor reads normally. RR, LR normal. Confirmed: LF WSS primary fault; C0040 likely triggered by EBCM rationality check when LF dropped to zero.

Physical inspection: LF wheel speed sensor connector — corrosion and green oxidation on pin terminals. Sensor wiring shows chafing near lower control arm, outer insulation cracked. Likely moisture intrusion causing intermittent open circuit. Sensor itself tests 980 ohms (spec 900–1100 ohms) — within range, but connector corrosion causing signal interruption.

Per GM TSB 22-NA-052: LF WSS wiring harness and connector replacement on 2019–2022 Silverado 1500. Sensor replacement also recommended when connector corrosion is present.

Brake inspection while vehicle in: front pads 5mm (acceptable), rotors within spec.`,
    prediiScore: 90,
    classifiedNotes: [
      {
        text: 'Customer states StabiliTrak and traction control lights on for approximately two weeks, ABS light joined yesterday. Intermittent left pull during hard braking.',
        section: 'complaint',
        confidence: 0.97,
        status: 'auto',
      },
      {
        text: 'LF wheel speed sensor connector shows heavy corrosion and green oxidation on pin terminals. Wiring harness chafed at lower control arm. Live data confirms intermittent signal dropout to 0 mph — triggering C0035 active fault. C0040 is secondary EBCM rationality code caused by LF dropout.',
        section: 'cause',
        confidence: 0.94,
        status: 'auto',
      },
      {
        text: 'Replace LF wheel speed sensor, connector pigtail, and wiring harness per GM TSB 22-NA-052. Clear C0035 and C0040 after repair and confirm continuous signal on live data.',
        section: 'correction',
        confidence: 0.92,
        status: 'auto',
      },
      {
        text: 'Battery at 82% CCA — borderline at 4 years. Monitor and plan replacement within next year. LR tire showing uneven wear — rotate tires after WSS repair.',
        section: 'recommendation',
        confidence: 0.90,
        status: 'auto',
      },
    ],
  },

  // 5 — 2017 Subaru Outback 2.5i Premium — Oil consumption/PCV
  '4S4BSANC4H3567890': {
    vehicle: {
      vin: '4S4BSANC4H3567890',
      year: 2017,
      make: 'Subaru',
      model: 'Outback',
      trim: '2.5i Premium',
      engine: '2.5L Flat-4 DOHC',
      transmission: 'Lineartronic CVT',
      driveType: 'AWD',
      fuelType: 'Gasoline',
      mileage: 73240,
    },
    ro: {
      id: 'RO-2405',
      customerId: 'CUST-1105',
      customerName: 'Thomas Lindqvist',
      concern: 'Having to add a quart of oil every 2,000 miles. No leaks visible under the car. Blue smoke on startup.',
      defaultComplaint: "I've had to add almost a quart of oil every 2,000 miles for the past 6 months. My driveway is clean so it's not leaking. Sometimes I see blue smoke when I first start it in the morning. Subaru told me this is 'normal' but it's gotten worse.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2405-01',
        item: 'PCV Valve/System',
        status: 'red',
        techNote: 'PCV valve flow restricted on bench test. Crankcase pressure elevated — 3.2 in-Hg measured vs spec <1.5 in-Hg. Contributing to oil consumption past piston rings.',
        measurement: 'Crankcase pressure: 3.2 in-Hg | PCV flow: restricted',
        oemSpec: 'Crankcase pressure <1.5 in-Hg; PCV valve must flow freely',
        actioned: true,
      },
      {
        id: 'dvi-2405-02',
        item: 'Engine Oil Level',
        status: 'red',
        techNote: '0.9 qt consumed in 1,950-mile consumption test. Confirmed excessive oil consumption pattern.',
        measurement: '0.9 qt per 1,950 miles',
        oemSpec: 'Acceptable: <1 qt per 1,200 miles (Subaru spec)',
        actioned: true,
      },
      {
        id: 'dvi-2405-03',
        item: 'Valve Cover Gasket',
        status: 'yellow',
        techNote: 'Minor seepage at rear valve cover gasket. Not contributing significantly to consumption but recommend monitoring.',
        measurement: 'Visual — trace seepage',
        oemSpec: 'Replace when seeping >1 drop per 10 minutes',
      },
      {
        id: 'dvi-2405-04',
        item: 'Tire Tread Depth',
        status: 'green',
        techNote: 'All four tires acceptable.',
        measurement: 'FL:6/32 FR:6/32 RL:5/32 RR:5/32',
      },
      {
        id: 'dvi-2405-05',
        item: 'Air Filter',
        status: 'yellow',
        techNote: 'Dirty, recommend replacement.',
        measurement: 'Visual — moderate debris',
      },
      {
        id: 'dvi-2405-06',
        item: 'Spark Plugs',
        status: 'yellow',
        techNote: 'At 73,000 miles, past Subaru 60,000-mile replacement spec.',
        measurement: 'Mileage: 73,240 mi',
        oemSpec: 'Replace every 60,000 miles',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: 'WRK-66-17-001',
        title: 'FB25 Engine Oil Consumption — PCV System Inspection and Customer Satisfaction Program',
        affectedCondition: '2013–2019 Outback/Legacy 2.5i: excessive oil consumption due to PCV valve restriction and/or piston ring wear; PCV replacement first step per CSP; engine replacement if consumption persists',
        relevanceScore: 0.97,
        source: 'Subaru Customer Satisfaction Program',
      },
      {
        tsbNumber: '02-157-17R',
        title: 'Oil Consumption Monitoring Procedure and Consumption Test Protocol — FB25 Engines',
        affectedCondition: '2,000-mile consumption test procedure; consumption test initiated at clean oil level; measured at 2,000 miles; results compared to spec',
        relevanceScore: 0.85,
        source: 'Subaru Technical Service Bulletin',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states progressive oil consumption — 1 quart per ~2,000 miles. No visible external leak. Blue smoke on cold start. Dealer previously told customer consumption within spec (Subaru spec was 1 qt/1,200 mi for this engine). Customer concerned consumption increasing.

Consumption test initiated: Engine cleaned, oil topped to full mark, 2,000-mile consumption drive cycle performed. Result: 0.9 qt consumed in 1,950 miles = approximately 1 qt / 2,100 miles.

Inspection: No external leaks at valve cover, oil pan, front crank seal, or cam seals. PCV system tested: PCV valve flow — restricted. PCV valve replacement due (original 73k miles). Restricted PCV causing elevated crankcase pressure, forcing oil past piston rings.

Cylinder leak-down: #1: 12%, #2: 9%, #3: 14%, #4: 11% — all within acceptable range (<20%). Compression: #1: 168, #2: 172, #3: 165, #4: 169 psi — normal.

Per Subaru Customer Satisfaction Program WRK-66: FB25 engine PCV system inspection and valve replacement. After PCV replacement, re-monitor consumption. If consumption persists >1 qt/1,200 miles after PCV repair, engine internal inspection warranted.

Valve stem seal replacement flagged as potential next step if consumption does not improve after PCV repair.`,
    prediiScore: 88,
    classifiedNotes: [
      {
        text: 'Customer states oil consumption of approximately 1 quart per 2,000 miles for 6 months, no visible driveway leaks, blue smoke on cold starts. Dealer previously dismissed as normal; customer reports consumption worsening.',
        section: 'complaint',
        confidence: 0.97,
        status: 'auto',
      },
      {
        text: 'PCV valve restricted on bench flow test — crankcase pressure measured 3.2 in-Hg against spec of <1.5 in-Hg. Elevated crankcase pressure forcing oil past piston rings. Consumption test confirms 0.9 qt in 1,950 miles. No external leaks, compression and leak-down within normal range.',
        section: 'cause',
        confidence: 0.94,
        status: 'auto',
      },
      {
        text: 'Replace PCV valve per Subaru CSP WRK-66-17-001. Re-initiate 2,000-mile consumption test after repair. If consumption persists above 1 qt/1,200 miles, escalate to valve stem seal and/or piston ring inspection.',
        section: 'correction',
        confidence: 0.91,
        status: 'auto',
      },
      {
        text: 'Replace spark plugs — 13,000 miles past Subaru 60,000-mile interval. Replace engine air filter. Monitor rear valve cover gasket seepage at next oil change.',
        section: 'recommendation',
        confidence: 0.90,
        status: 'auto',
      },
    ],
  },

  // 6 — 2022 Toyota RAV4 XLE AWD — Highway vibration / road force tire belt shift
  '2T3RWRFV5NW678901': {
    vehicle: {
      vin: '2T3RWRFV5NW678901',
      year: 2022,
      make: 'Toyota',
      model: 'RAV4',
      trim: 'XLE AWD',
      engine: '2.5L I4 DOHC',
      transmission: '8-Speed Automatic',
      driveType: 'AWD',
      fuelType: 'Gasoline',
      mileage: 31180,
    },
    ro: {
      id: 'RO-2406',
      customerId: 'CUST-1106',
      customerName: 'Sandra Okafor',
      concern: 'Steering wheel shakes between 60–70 mph. Happens on smooth highway, not just rough roads. Gets better above 75.',
      defaultComplaint: "My steering wheel vibrates between 60 and 70 miles per hour on smooth roads — I notice it most on the freeway. It gets better when I go above 75. I bought the car new in 2022 and it's been doing this since about 25,000 miles.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2406-01',
        item: 'RF Tire — Road Force Balance',
        status: 'red',
        techNote: 'Road force: 26 lbs (spec <20 lbs). Lateral runout: 0.031" (spec <0.025"). Belt shift confirmed — rebalance cannot correct. Replacement required.',
        measurement: 'Road force: 26 lbs | Lateral runout: 0.031"',
        oemSpec: 'Road force <20 lbs | Runout <0.025"',
        photoRef: 'photo-2406-rf-tire-runout.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2406-02',
        item: 'RR Tire — Road Force Balance',
        status: 'yellow',
        techNote: 'Road force: 21 lbs — marginally above spec. Rotation and rebalance recommended.',
        measurement: 'Road force: 21 lbs',
        oemSpec: 'Road force <20 lbs',
      },
      {
        id: 'dvi-2406-03',
        item: 'Brake Pads Front',
        status: 'green',
        techNote: 'Front pads at 7mm. Good.',
        measurement: 'LF: 7mm | RF: 7mm',
      },
      {
        id: 'dvi-2406-04',
        item: 'Engine Oil',
        status: 'green',
        techNote: 'Level full, color normal. Oil change recent (3,100 miles).',
      },
      {
        id: 'dvi-2406-05',
        item: 'Tire Tread Depth',
        status: 'green',
        techNote: 'All four tires good — low mileage vehicle.',
        measurement: 'FL:10/32 FR:10/32 RL:10/32 RR:10/32',
      },
      {
        id: 'dvi-2406-06',
        item: 'Alignment Check',
        status: 'yellow',
        techNote: 'Toe-in slightly off spec (possibly related to tire wear pattern). Full alignment recommended at next service.',
        measurement: 'Front toe: +0.15° (spec +0.05° ±0.10°)',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: 'FR-22-8834',
        title: 'Highway Speed Vibration — OEM Bridgestone Ecopia Tire Belt Shift on 2022 RAV4',
        affectedCondition: '2022 RAV4 (all trims): OEM Bridgestone Ecopia EP422 tires subject to belt migration causing high road force values; resonance vibration at 60–70 mph; road force balance test required; tire replacement resolves',
        relevanceScore: 0.97,
        source: 'Toyota Field Technical Report',
      },
      {
        tsbNumber: 'T-SB-0091-22',
        title: 'Steering Wheel Vibration Diagnosis — Road Force Balance Procedure for RAV4',
        affectedCondition: 'Use road force balancer (Hunter GSP9700 or equivalent); spec is <20 lbs road force; high road force indicates tire, not balance weight, is root cause',
        relevanceScore: 0.88,
        source: 'Toyota Technical Information System',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states steering wheel vibration at highway speeds, specifically 60–70 mph. Symptom present on smooth pavement, not road noise. Resolves above 75 mph. Onset ~25,000 miles (now 31,180 miles).

Road test confirmed: Vibration felt through steering column and floor at 63–68 mph. Smooth above 72 mph and below 55 mph. Classic "resonance band" vibration pattern — wheel balance issue.

Inspection: Tire/wheel visual — no visible damage, no bent wheels. Road force balance test performed on all four tires:
- LF: 18 lbs road force (spec <20 lbs) — acceptable
- RF: 26 lbs road force — out of spec
- LR: 14 lbs (acceptable)
- RR: 21 lbs — marginally out of spec

RF tire shows slight lateral runout of 0.031" (spec <0.025"). Wheel itself tests true. High road force on RF indicates tire belt shift — common issue on 2022 RAV4 with OEM Bridgestone Ecopia tires per Toyota Field Report FR-22-8834.

Rebalance performed — did not resolve RF high road force. Tire swap/replace recommended for RF. RR marginally out of spec — rotation and rebalance recommended.

Per Toyota Customer Support Program (CSP) related to FR-22-8834: tire replacement at warranty consideration if <36,000 miles. Customer advised — 31,180 miles, within warranty period.`,
    prediiScore: 96,
    classifiedNotes: [
      {
        text: 'Customer states steering wheel vibration between 60 and 70 mph on smooth highway, resolves above 75 mph. Onset at approximately 25,000 miles. Vehicle purchased new in 2022.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'Road force balance test: RF tire measures 26 lbs road force (spec <20 lbs) with lateral runout 0.031" (spec <0.025"). Consistent with tire belt shift — standard rebalance cannot correct. Matches Toyota Field Report FR-22-8834 pattern for OEM Bridgestone Ecopia tires on 2022 RAV4.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Replace RF tire per Toyota FR-22-8834 — vehicle at 31,180 miles, within 36,000-mile warranty consideration period. Rotate and rebalance RR tire (road force 21 lbs, marginally out of spec).',
        section: 'correction',
        confidence: 0.93,
        status: 'auto',
      },
      {
        text: 'Advise customer to open Toyota warranty claim for RF tire before replacement. Schedule full 4-wheel alignment — front toe slightly off spec at +0.15° against spec +0.05° ±0.10°.',
        section: 'recommendation',
        confidence: 0.91,
        status: 'auto',
      },
    ],
  },

  // 7 — 2016 Honda Accord EX-L 2.4L — Torque converter shudder / ATF degradation
  '1HGCR2F87GA789012': {
    vehicle: {
      vin: '1HGCR2F87GA789012',
      year: 2016,
      make: 'Honda',
      model: 'Accord',
      trim: 'EX-L',
      engine: '2.4L I4 DOHC i-VTEC',
      transmission: '6-Speed Automatic',
      driveType: 'FWD',
      fuelType: 'Gasoline',
      mileage: 94220,
    },
    ro: {
      id: 'RO-2407',
      customerId: 'CUST-1107',
      customerName: 'Benjamin Achebe',
      concern: 'Transmission shudder when accelerating from a stop, especially between 25–40 mph. Sometimes hesitates.',
      defaultComplaint: "My car shudders and hesitates when I accelerate from a stop — it's worst between about 25 and 40 miles an hour, like it can't decide which gear to be in. It's been getting worse for the last 3 months.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2407-01',
        item: 'Transmission Fluid Condition',
        status: 'red',
        techNote: 'ATF dark brown/oxidized at 94,220 miles — never serviced. Metallic fines on drain magnet. TCC slip at 4.2% confirmed in live data. Fluid replacement required, may resolve TC shudder.',
        measurement: 'TCC slip: 4.2% | Fluid color: dark brown',
        oemSpec: 'TCC slip <1%; fluid should be pink/amber; replace at 90,000 miles',
        photoRef: 'photo-2407-atf-sample.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2407-02',
        item: 'Engine Air Filter',
        status: 'yellow',
        techNote: 'Filter at ~40% remaining life. Recommend replacement at next oil change.',
        measurement: 'Visual — moderate debris',
      },
      {
        id: 'dvi-2407-03',
        item: 'Brake Pads Front',
        status: 'green',
        techNote: '5mm remaining, acceptable.',
        measurement: 'LF: 5mm | RF: 5mm',
      },
      {
        id: 'dvi-2407-04',
        item: 'Brake Pads Rear',
        status: 'yellow',
        techNote: 'Rear pads at 3.5mm. Approaching service limit.',
        measurement: 'LR: 3.5mm | RR: 3mm',
        oemSpec: 'Replace at 3mm',
      },
      {
        id: 'dvi-2407-05',
        item: 'Tire Tread Depth',
        status: 'yellow',
        techNote: 'All four tires approaching replacement. Customer should plan for tire replacement within 10,000 miles.',
        measurement: 'FL:3/32 FR:3/32 RL:4/32 RR:4/32',
        oemSpec: 'Minimum 2/32',
      },
      {
        id: 'dvi-2407-06',
        item: 'Engine Oil',
        status: 'green',
        techNote: 'Level full, recent change sticker (2,100 miles). Color good.',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: '15-082',
        title: 'CVT Fluid Degradation — Torque Converter Shudder at Light Throttle 2013–2016 Accord 2.4L',
        affectedCondition: 'Torque converter shudder (7–9 Hz vibration) during light acceleration at 25–45 mph; caused by CVT/ATF degradation; Honda DW-1 fluid replacement resolves in majority of cases; TC replacement if shudder persists after fluid service',
        relevanceScore: 0.97,
        source: 'Honda Service News',
      },
      {
        tsbNumber: '16-044',
        title: 'ATF Inspection and Change Interval — 2013–2016 Accord Extended Fluid Life Assessment',
        affectedCondition: 'Under severe use conditions, 90,000-mile ATF interval may be insufficient; inspect fluid for discoloration, metallic content, and burnt smell; replace regardless of interval if degraded',
        relevanceScore: 0.82,
        source: 'Honda Service News',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states transmission shudder and hesitation during light acceleration from 25–40 mph. Progressive onset 3 months. No MIL.

Road test confirmed: torque converter shudder during light throttle application at 25–45 mph. Shudder manifests as rapid vibration (7–9 Hz), consistent with CVT/torque converter clutch slip. Lock-up clutch engaging and releasing rapidly rather than smooth lockup.

Scan: No DTCs. TM fluid temp normal. Live data: TCC lockup command — locking at 28 mph as expected; slip % during lockup: 4.2% (should be <1%). Confirms TC clutch friction material degradation.

ATF inspection: drain sample taken. Fluid is dark brown (should be light pink/amber). Metallic fines visible in drain magnet — not excessive, but present. No burnt smell. Fluid oxidized. Service interval: 90,000 miles per Honda, but degraded fluid accelerates TC clutch wear. Vehicle at 94,220 miles — first fluid change ever.

Per Honda Service Bulletin 15-082 (applies to 2013–2016 Accord 2.4L): CVT fluid degradation causing TCC shudder. Honda DW-1 fluid replacement resolves in majority of cases. If shudder persists after fluid service: TC replacement required.

Recommend: ATF flush and refill with genuine Honda DW-1. Advise customer that if shudder persists after fluid change, TC replacement will be needed.`,
    prediiScore: 89,
    classifiedNotes: [
      {
        text: 'Customer reports transmission shudder and hesitation during acceleration from stop, worst between 25 and 40 mph, progressing over the last 3 months.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'ATF dark brown and oxidized — never serviced in 94,220 miles (first change due at 90,000). Metallic fines on drain magnet. Live data confirms TCC slip at 4.2% against spec <1%, indicating torque converter clutch friction material degradation from degraded fluid.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Perform ATF drain and fill with genuine Honda DW-1 fluid per TSB 15-082. Re-evaluate TCC slip on live data after fluid service. If shudder persists, torque converter replacement will be required.',
        section: 'correction',
        confidence: 0.92,
        status: 'auto',
      },
      {
        text: 'Rear brake pads at 3mm (RR at limit) — schedule rear brake service. All four tires at 3–4/32 — plan tire replacement within 10,000 miles.',
        section: 'recommendation',
        confidence: 0.91,
        status: 'auto',
      },
    ],
  },

  // 8 — 2019 Jeep Grand Cherokee Laredo — LF brake metal-to-metal / seized caliper
  '1C4RJFAG6KC890123': {
    vehicle: {
      vin: '1C4RJFAG6KC890123',
      year: 2019,
      make: 'Jeep',
      model: 'Grand Cherokee',
      trim: 'Laredo',
      engine: '3.6L V6 Pentastar',
      transmission: '8-Speed Automatic',
      driveType: '4WD',
      fuelType: 'Gasoline',
      mileage: 61880,
    },
    ro: {
      id: 'RO-2408',
      customerId: 'CUST-1108',
      customerName: 'Camille Tran',
      concern: 'Grinding noise when braking, especially from the front left. Brake pedal goes lower than it used to.',
      defaultComplaint: "I hear a grinding noise when I brake — it's loudest when braking from the front left. The brake pedal also seems to go down further than it used to, and the car takes longer to stop. I'm worried it's not safe.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2408-01',
        item: 'LF Brake Pads/Rotors',
        status: 'red',
        techNote: 'LF pad at 1mm — metal to metal contact. Rotor severely scored with 2.1mm grooves. Immediate safety concern. LF caliper slide pin seized — caused accelerated inner pad wear.',
        measurement: 'LF pad: 1mm | Rotor groove depth: 2.1mm',
        oemSpec: 'Replace pads at 3mm; rotors must be within 1mm of minimum thickness',
        photoRef: 'photo-2408-lf-rotor-scoring.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2408-02',
        item: 'RF Brake Pads/Rotors',
        status: 'red',
        techNote: 'RF pad at 3mm (at wear limit). Rotor surface scored. Replace at same time as LF.',
        measurement: 'RF pad: 3mm | Rotor: scored',
        oemSpec: 'Replace at 3mm',
        actioned: true,
      },
      {
        id: 'dvi-2408-03',
        item: 'LF Caliper Hardware/Slide Pins',
        status: 'red',
        techNote: 'Slide pins dry, corroded, boots torn. Seizing causing uneven pad wear. Must be serviced with brake job.',
        measurement: 'Visual — torn boots, corrosion, no lubrication',
        actioned: true,
      },
      {
        id: 'dvi-2408-04',
        item: 'Brake Fluid',
        status: 'yellow',
        techNote: 'Moisture content 4.1% — above 3% replacement threshold.',
        measurement: '4.1% moisture',
        oemSpec: 'Replace when >3.0%',
      },
      {
        id: 'dvi-2408-05',
        item: 'Rear Brake Pads',
        status: 'green',
        techNote: 'Rear pads at 5mm — acceptable.',
        measurement: 'LR: 5mm | RR: 5mm',
      },
      {
        id: 'dvi-2408-06',
        item: 'Tire Tread Depth',
        status: 'green',
        techNote: 'All four tires acceptable.',
        measurement: 'FL:6/32 FR:6/32 RL:5/32 RR:5/32',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: '05-001-19',
        title: 'Front Brake Noise and Premature Pad Wear — Caliper Slide Pin Inspection 2018–2020 Grand Cherokee',
        affectedCondition: 'Front brake grinding, squeal, or rapid pad wear caused by caliper slide pin corrosion/seizing; inner pad wears faster than outer; slide pin and hardware replacement resolves; rotor replacement typically required when pins seize',
        relevanceScore: 0.96,
        source: 'FCA Technical Service Bulletin',
      },
      {
        tsbNumber: '05-010-19',
        title: 'Brake Pedal Travel Increase — Rear Brake Drum/Rotor Inspection and Fluid Flush Procedure',
        affectedCondition: '2018–2020 Grand Cherokee: increased brake pedal travel associated with brake fluid moisture content >3%; brake fluid flush restores normal pedal feel',
        relevanceScore: 0.73,
        source: 'FCA Technical Service Bulletin',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states LF grinding on braking, low brake pedal, increased stopping distance. Safety concern.

Road test: Grinding confirmed LF during moderate braking. Pedal travel 20% longer than baseline. No brake pull. No ABS fault codes.

Inspection: LF rotor — severe scoring, 2.1mm grooves visible on friction surface. Pad thickness: LF 1mm (metal to metal contact confirmed — wear indicator squealing evident). RF pad: 3mm remaining, rotor marginally scored. Rear pads: LR 5mm, RR 5mm — good. Rear rotors within spec.

LF caliper slide pins: dry, no lubrication, significant corrosion on inboard slide pin. Uneven wear on LF — inboard pad wore 3x faster than outboard. Caliper slide pin seizing causing uneven pad application. Both LF slide pins must be cleaned, lubricated, and boots replaced. Boots are torn.

Brake fluid: moisture content 4.1% — above 3% replacement threshold. Recommend brake flush.

Per Jeep/FCA TSB 05-001-19: Front brake noise and premature wear on 2018–2020 Grand Cherokee — caliper slide pin inspection required.

Recommend: LF pad and rotor replacement (metal to metal). RF pad and rotor replacement (rotor scored). LF caliper hardware kit and slide pin service. Brake fluid flush.`,
    prediiScore: 95,
    classifiedNotes: [
      {
        text: 'Customer reports grinding noise when braking loudest from front left, brake pedal travel increased, longer stopping distance. Customer concerned about safety.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'LF brake pad at 1mm — metal to metal contact confirmed. Rotor severely scored with 2.1mm grooves. LF caliper slide pins seized with torn boots and corrosion, causing inner pad to wear 3x faster than outer. RF pad also at 3mm wear limit with scored rotor. Brake fluid at 4.1% moisture — above 3% threshold contributing to extended pedal travel.',
        section: 'cause',
        confidence: 0.96,
        status: 'auto',
      },
      {
        text: 'Replace LF and RF brake pads and rotors as front axle set. Replace LF caliper hardware kit and slide pins per FCA TSB 05-001-19. Flush brake fluid — moisture at 4.1%.',
        section: 'correction',
        confidence: 0.93,
        status: 'auto',
      },
      {
        text: 'Rear brakes at 5mm — good. Re-inspect rear at next oil service. Road test after repair to verify pedal feel and stopping distance before returning vehicle.',
        section: 'recommendation',
        confidence: 0.91,
        status: 'auto',
      },
    ],
  },

  // 9 — 2020 Ford Explorer ST 3.0T — Coolant loss/degas bottle
  '1FM5K8GC0LGA90123': {
    vehicle: {
      vin: '1FM5K8GC0LGA90123',
      year: 2020,
      make: 'Ford',
      model: 'Explorer',
      trim: 'ST',
      engine: '3.0L Twin-Turbo V6 EcoBoost',
      transmission: '10-Speed Automatic',
      driveType: '4WD',
      fuelType: 'Gasoline',
      mileage: 52140,
    },
    ro: {
      id: 'RO-2409',
      customerId: 'CUST-1109',
      customerName: 'Raj Sharma',
      concern: 'Low coolant warning came on. Added coolant twice in one month. No visible leaks, no overheating.',
      defaultComplaint: "The low coolant warning light came on about a month ago and I've had to add coolant twice. I don't see any puddles under the car and the car hasn't overheated, but I'm losing coolant somewhere.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2409-01',
        item: 'Degas Bottle/Coolant Reservoir',
        status: 'red',
        techNote: 'Hairline crack at weld seam, lower right, confirmed with UV dye. Intermittent seep — seals under pressure test conditions but leaks during normal thermal cycling. This is root cause of coolant loss.',
        measurement: 'Crack length: ~15mm at weld seam | UV dye confirmed',
        oemSpec: 'No cracks or leaks permitted',
        photoRef: 'photo-2409-degas-crack-uv.jpg',
        actioned: true,
      },
      {
        id: 'dvi-2409-02',
        item: 'Coolant Level',
        status: 'red',
        techNote: '1.5 inches below MIN mark at inspection. Refilled to MAX.',
        measurement: '1.5" below MIN mark',
        actioned: true,
      },
      {
        id: 'dvi-2409-03',
        item: 'Coolant Condition',
        status: 'green',
        techNote: 'pH 7.8, color good, no contamination, combustion check negative.',
      },
      {
        id: 'dvi-2409-04',
        item: 'Drive Belt',
        status: 'yellow',
        techNote: 'Belt shows minor surface cracking. At 52,000 miles approaching end of service life.',
        measurement: 'Visual — minor surface cracks',
        oemSpec: 'Replace every 60,000 miles or at first sign of cracking',
      },
      {
        id: 'dvi-2409-05',
        item: 'Brake Pads Front',
        status: 'green',
        techNote: '6mm — good.',
        measurement: 'LF: 6mm | RF: 6mm',
      },
      {
        id: 'dvi-2409-06',
        item: 'Tire Tread Depth',
        status: 'green',
        techNote: 'All four tires acceptable.',
        measurement: 'FL:7/32 FR:7/32 RL:6/32 RR:6/32',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: '21-2265',
        title: 'Coolant Loss — Degas Bottle Weld Seam Crack on 2020–2021 Explorer 3.0T EcoBoost',
        affectedCondition: '2020–2021 Explorer ST 3.0T: coolant reservoir (degas bottle) develops hairline crack at weld seam; coolant loss without visible external puddle; leak occurs under thermal expansion at operating temperature; degas bottle replacement resolves',
        relevanceScore: 0.98,
        source: 'Ford Technical Service Bulletin',
      },
      {
        tsbNumber: '21-0143',
        title: 'Coolant Loss Diagnosis — Pressure Test Limitations and UV Dye Trace Procedure for 3.0T EcoBoost',
        affectedCondition: 'Standard pressure test may not detect intermittent degas bottle seep; UV dye trace with blacklight inspection required to confirm seam crack; system holds pressure at ambient temp but seeps at operating temp',
        relevanceScore: 0.91,
        source: 'Ford Technical Service Bulletin',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states coolant loss — low coolant warning x2 in one month. No external puddles, no overheating events, no steam. No DTCs present.

Inspection: Coolant level 1.5 inches below MIN mark. Added coolant to bring to full, marked level with paint pen. Pressure test: system held 18 psi for 15 minutes — no pressure loss detected at pressure test. External leak sources negative.

Degas bottle inspection: 2020–2021 Ford Explorer ST 3.0T EcoBoost degas bottle (pressurized coolant reservoir) — hairline crack visible at weld seam on lower right corner. Crack approximately 15mm, intermittent sealing — leaks under thermal expansion pressure (operating temp) but may seal at ambient temp and pressure test.

Verification: applied compressed air dye trace test — ultraviolet dye in coolant confirmed at degas bottle crack seam. This is consistent with NHTSA complaint pattern (ODI #11385952 and related complaints — 2020 Explorer degas bottle failure).

Engine coolant: good condition, no combustion contamination, pH 7.8 (appropriate). Combustion check negative (no HC in coolant). No white exhaust smoke. Head gasket not suspected.

Per Ford TSB 21-2265: Degas bottle replacement on 2020–2021 Explorer 3.0T EcoBoost due to hairline cracking at weld seam. This is a known failure pattern — also covered under extended warranty extension for some customers.`,
    prediiScore: 93,
    classifiedNotes: [
      {
        text: 'Customer states low coolant warning light activated, coolant added twice in the past month. No visible puddles under vehicle, no overheating events observed.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'Degas bottle hairline crack confirmed at lower-right weld seam via UV dye trace — approximately 15mm crack. Standard pressure test did not detect leak (seals at ambient temp). Leak occurs during thermal cycling at operating temperature. Matches Ford TSB 21-2265 and NHTSA complaint pattern ODI #11385952.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Replace degas bottle per Ford TSB 21-2265. Refill system with Motorcraft orange coolant VC-3DIL-B. Perform UV dye pressure test after repair to confirm correction. Check for extended warranty coverage before billing customer.',
        section: 'correction',
        confidence: 0.93,
        status: 'auto',
      },
      {
        text: 'Drive belt showing surface cracking at 52,000 miles — schedule replacement before 60,000-mile interval. Monitor coolant level for two weeks post-repair as confirmation.',
        section: 'recommendation',
        confidence: 0.91,
        status: 'auto',
      },
    ],
  },

  // 10 — 2018 Nissan Altima SV 2.5L — Serpentine belt squeal / tensioner / OAD pulley
  '1N4AL3AP1JC012345': {
    vehicle: {
      vin: '1N4AL3AP1JC012345',
      year: 2018,
      make: 'Nissan',
      model: 'Altima',
      trim: 'SV',
      engine: '2.5L I4 DOHC',
      transmission: 'Xtronic CVT',
      driveType: 'FWD',
      fuelType: 'Gasoline',
      mileage: 77450,
    },
    ro: {
      id: 'RO-2410',
      customerId: 'CUST-1110',
      customerName: 'Grace Fitzgerald',
      concern: 'Loud squealing noise from engine bay when starting cold. Goes away after a few minutes. Getting louder over time.',
      defaultComplaint: "There's been a really loud squealing or chirping noise from under the hood for the past couple of months. It's worst right when I start the car when it's cold — after a few minutes it stops or gets quieter. It's definitely gotten louder in the last few weeks.",
      status: 'in_progress',
    },
    dviFindings: [
      {
        id: 'dvi-2410-01',
        item: 'Serpentine Belt',
        status: 'red',
        techNote: 'Glazed inner surface causing cold-start slip. Belt at 77,450 miles — original fitment. Brittle, glazed. Belt slip confirmed with belt dressing test.',
        measurement: 'Age: ~77,450 miles (original)',
        oemSpec: 'Replace every 60,000–100,000 miles; replace immediately if glazed',
        actioned: true,
      },
      {
        id: 'dvi-2410-02',
        item: 'Belt Tensioner',
        status: 'red',
        techNote: 'Tensioner spring tension: 65 lbs (spec 85–105 lbs). Spring fatigued. Insufficient tension causes cold-start belt slip. Replace with belt.',
        measurement: 'Spring tension: 65 lbs',
        oemSpec: 'Spec: 85–105 lbs',
        actioned: true,
      },
      {
        id: 'dvi-2410-03',
        item: 'Alternator OAD Pulley',
        status: 'red',
        techNote: 'Slight roughness in overrunning direction — OAD clutch wearing. Replace with belt and tensioner.',
        measurement: 'Roughness detected in overrunning direction',
        oemSpec: 'OAD pulley must freewheel smoothly in overrunning direction',
        actioned: true,
      },
      {
        id: 'dvi-2410-04',
        item: 'Engine Oil',
        status: 'green',
        techNote: 'Level full, color good. Recent change (1,800 miles).',
      },
      {
        id: 'dvi-2410-05',
        item: 'Brake Pads Front',
        status: 'yellow',
        techNote: 'Front pads at 4mm. Approaching service interval.',
        measurement: 'LF: 4mm | RF: 4mm',
        oemSpec: 'Replace at 3mm',
      },
      {
        id: 'dvi-2410-06',
        item: 'Coolant Level',
        status: 'green',
        techNote: 'Level at MAX cold mark. Color normal orange.',
      },
    ],
    tsbMatches: [
      {
        tsbNumber: 'NTB17-076',
        title: 'Belt Squeal on Cold Start — Serpentine Belt, Tensioner, and OAD Pulley Service 2016–2018 Altima 2.5L',
        affectedCondition: '2016–2018 Altima QR25DE: cold-start belt squeal caused by glazed serpentine belt and fatigued tensioner spring; alternator OAD pulley may also contribute; replace belt, tensioner, and OAD pulley as assembly',
        relevanceScore: 0.96,
        source: 'Nissan Technical Service Bulletin',
      },
      {
        tsbNumber: 'NTB18-044',
        title: 'Alternator OAD Pulley Inspection — QR25DE Engine Belt Drive System',
        affectedCondition: 'Overrunning alternator decoupler (OAD) pulley bearing wear causes intermittent chirp and belt slippage; test by rotating pulley by hand in both directions; roughness in overrunning direction indicates replacement',
        relevanceScore: 0.88,
        source: 'Nissan Technical Service Bulletin',
      },
    ],
    dtcCodes: [],
    techNotes: `Customer states cold-start chirping/squealing from engine bay, 2 months progressive, resolves after warm-up. Louder in cold weather.

Inspection: Start engine cold — loud belt squeal immediately evident from serpentine belt system. Noise reduces after 2–3 minutes as engine warms and belt expands. Apply belt dressing — squeal increases briefly then stops (confirms belt slip, not pulley bearing noise).

Belt inspection: Serpentine belt — condition appears adequate on visual inspection, but glazing on inner (ribbed) surface. Belt age unknown — likely original (77,450 miles). Belt hardness: thumped against concrete — brittle response. Glazed belt surface loses coefficient of friction when cold, causing slip on drive pulleys.

Tension system: Belt tensioner spring tension tested — 65 lbs measured, spec 85–105 lbs. Tensioner spring fatigued — insufficient tension allows belt to slip on cold start. Tensioner arm shows wear at pivot. Tensioner replacement required in addition to belt.

Idler pulley: bearing smooth, no roughness. A/C clutch pulley: smooth. Alternator pulley: one-way clutch (OAD) tested — slight roughness when rotated opposite drive direction. OAD pulley failing — may also contribute to noise and should be replaced with belt.

Recommend: Serpentine belt, tensioner, and alternator OAD pulley replacement as a set.`,
    prediiScore: 91,
    classifiedNotes: [
      {
        text: 'Customer reports loud squealing or chirping noise from engine bay for 2 months, worst on cold starts, diminishes after warm-up. Noise has progressively worsened over recent weeks.',
        section: 'complaint',
        confidence: 0.98,
        status: 'auto',
      },
      {
        text: 'Belt dressing test confirms belt slip as noise source. Serpentine belt original at 77,450 miles — glazed inner surface loses grip when cold. Belt tensioner spring tension at 65 lbs against spec 85–105 lbs — fatigued spring allows belt slip. Alternator OAD pulley shows roughness in overrunning direction — clutch wearing.',
        section: 'cause',
        confidence: 0.95,
        status: 'auto',
      },
      {
        text: 'Replace serpentine belt, belt tensioner, and alternator OAD pulley as a set per Nissan TSB NTB17-076. Verify all remaining accessory pulleys spin freely after installation.',
        section: 'correction',
        confidence: 0.93,
        status: 'auto',
      },
      {
        text: 'Front brake pads at 4mm — schedule replacement within next 10,000–15,000 miles. Idler pulley currently smooth — re-inspect at belt replacement as a precaution.',
        section: 'recommendation',
        confidence: 0.90,
        status: 'auto',
      },
    ],
  },
};

/**
 * Array of all pre-seeded demo VINs.
 * @type {string[]}
 */
export const DEMO_VINS = Object.keys(DEMO_REGISTRY);

/**
 * Returns true if the given shop ID is a demo account or if DEMO_MODE is set.
 * @param {string} shopId
 * @returns {boolean}
 */
export function isDemoMode(shopId) {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEMO_MODE === 'true') {
    return true;
  }
  if (typeof process !== 'undefined' && process.env && process.env.DEMO_MODE === 'true') {
    return true;
  }
  if (typeof shopId === 'string' && /^DEMO-/i.test(shopId)) {
    return true;
  }
  return false;
}

/**
 * Returns the vehicle record for a given VIN from the demo registry, or null if not found.
 * @param {string} vin
 * @returns {Vehicle|null}
 */
export function getDemoVehicle(vin) {
  const entry = DEMO_REGISTRY[vin];
  return entry ? entry.vehicle : null;
}

/**
 * Returns the repair order record for a given VIN from the demo registry, or null if not found.
 * @param {string} vin
 * @returns {RepairOrder|null}
 */
export function getDemoRO(vin) {
  const entry = DEMO_REGISTRY[vin];
  return entry ? entry.ro : null;
}
