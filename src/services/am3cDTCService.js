/**
 * am3cDTCService.js
 * Diagnostic Scan Integration — OBD-II DTC ingestion into the 3C pipeline
 * Jira AE-879
 *
 * Ingests DTC codes and freeze frame data and enriches them for use in
 * the Cause section of the 3C Story Writer.
 */

import { DEMO_REGISTRY } from '../data/am3cDemoRegistry.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maps DTC first-letter prefix to system name */
export const DTC_SYSTEMS = {
  P: 'powertrain',
  B: 'body',
  C: 'chassis',
  U: 'network',
};

export const DTC_SEVERITIES = {
  CRITICAL: 'critical',
  MODERATE: 'moderate',
  INFORMATIONAL: 'informational',
};

export const DTC_STATUSES = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  HISTORICAL: 'historical',
};

// ---------------------------------------------------------------------------
// Hardcoded DTC library (demo mode — 15+ common codes)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FreezeFrame
 * @property {number} rpm
 * @property {number} coolantTemp   degrees C
 * @property {number} mapKpa        manifold absolute pressure kPa
 * @property {number} fuelTrimST    short-term fuel trim %
 * @property {number} fuelTrimLT    long-term fuel trim %
 * @property {number} vehicleSpeed  km/h
 * @property {number} engineLoad    % calculated load
 */

/**
 * @typedef {Object} DTCResult
 * @property {string}   code
 * @property {string}   description
 * @property {string}   system       powertrain | body | chassis | network
 * @property {string}   severity     critical | moderate | informational
 * @property {string}   status       confirmed | pending | historical
 * @property {string[]} possibleCauses
 * @property {FreezeFrame} [freezeFrame]
 */

/** @type {Object.<string, Omit<DTCResult, 'code'|'status'>>} */
const DTC_LIBRARY = {
  P0420: {
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'Catalytic converter degraded or failed',
      'Upstream or downstream O2 sensor fault',
      'Exhaust leak upstream of catalyst',
      'Engine misfire contaminating catalyst',
      'Coolant or oil consumption fouling catalyst',
    ],
    freezeFrame: { rpm: 1850, coolantTemp: 90, mapKpa: 45, fuelTrimST: 1.6, fuelTrimLT: 2.3, vehicleSpeed: 55, engineLoad: 38 },
  },
  P0300: {
    description: 'Random/Multiple Cylinder Misfire Detected',
    system: 'powertrain',
    severity: DTC_SEVERITIES.CRITICAL,
    possibleCauses: [
      'Spark plugs worn or fouled',
      'Ignition coil(s) failing',
      'Fuel injector(s) restricted or leaking',
      'Low fuel pressure',
      'Vacuum leak causing lean misfire',
      'Low compression in multiple cylinders',
    ],
    freezeFrame: { rpm: 760, coolantTemp: 88, mapKpa: 35, fuelTrimST: 5.5, fuelTrimLT: 7.0, vehicleSpeed: 0, engineLoad: 22 },
  },
  P0303: {
    description: 'Cylinder 3 Misfire Detected',
    system: 'powertrain',
    severity: DTC_SEVERITIES.CRITICAL,
    possibleCauses: [
      'Spark plug fouled or worn on cylinder 3',
      'Ignition coil on cylinder 3 failed',
      'Fuel injector on cylinder 3 restricted or failed',
      'Low compression on cylinder 3',
      'Valve train issue on cylinder 3',
    ],
    freezeFrame: { rpm: 820, coolantTemp: 91, mapKpa: 37, fuelTrimST: 4.7, fuelTrimLT: 6.2, vehicleSpeed: 0, engineLoad: 25 },
  },
  P0171: {
    description: 'System Too Lean (Bank 1)',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'Mass airflow sensor dirty or failed',
      'Vacuum leak downstream of MAF',
      'Fuel pressure low — weak pump or clogged filter',
      'Injector(s) clogged or restricted',
      'O2 sensor lazy or contaminated',
      'PCV system leak',
    ],
    freezeFrame: { rpm: 1500, coolantTemp: 92, mapKpa: 40, fuelTrimST: 18.4, fuelTrimLT: 22.1, vehicleSpeed: 35, engineLoad: 33 },
  },
  P0174: {
    description: 'System Too Lean (Bank 2)',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'Mass airflow sensor dirty or failed',
      'Vacuum leak on Bank 2 intake',
      'Low fuel pressure',
      'Bank 2 injectors restricted',
      'O2 sensor on Bank 2 faulty',
    ],
    freezeFrame: { rpm: 1520, coolantTemp: 91, mapKpa: 41, fuelTrimST: 17.9, fuelTrimLT: 21.5, vehicleSpeed: 33, engineLoad: 34 },
  },
  P0442: {
    description: 'Evaporative Emission Control System Leak Detected (Small Leak)',
    system: 'powertrain',
    severity: DTC_SEVERITIES.INFORMATIONAL,
    possibleCauses: [
      'Loose or missing fuel cap',
      'Cracked or deteriorated EVAP hose',
      'Purge valve or vent valve leaking',
      'Charcoal canister cracked or saturated',
      'Fuel tank pressure sensor fault',
    ],
    freezeFrame: null,
  },
  P0455: {
    description: 'Evaporative Emission Control System Leak Detected (Large Leak)',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'Fuel cap missing, damaged, or not tightened',
      'Large EVAP hose disconnected or cracked',
      'Purge solenoid stuck open',
      'Vent solenoid failed open',
      'Fuel tank filler neck damaged',
    ],
    freezeFrame: null,
  },
  P0128: {
    description: 'Coolant Temperature Below Thermostat Regulating Temperature',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'Thermostat stuck open or failed',
      'Coolant temperature sensor out of calibration',
      'Extended idling in cold ambient conditions',
    ],
    freezeFrame: { rpm: 1100, coolantTemp: 68, mapKpa: 38, fuelTrimST: 3.1, fuelTrimLT: 4.8, vehicleSpeed: 28, engineLoad: 29 },
  },
  P0507: {
    description: 'Idle Air Control System RPM High',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'IAC valve stuck open or carbon-fouled',
      'Vacuum leak at intake manifold gasket or hose',
      'Throttle body dirty — carbon deposits on bore',
      'Electronic throttle control fault',
    ],
    freezeFrame: { rpm: 1380, coolantTemp: 90, mapKpa: 32, fuelTrimST: -2.3, fuelTrimLT: -1.5, vehicleSpeed: 0, engineLoad: 18 },
  },
  P0401: {
    description: 'Exhaust Gas Recirculation Flow Insufficient Detected',
    system: 'powertrain',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'EGR valve clogged with carbon deposits',
      'EGR passage blocked',
      'EGR valve stuck closed',
      'EGR pressure feedback sensor failed',
      'DPFE sensor out of range',
    ],
    freezeFrame: { rpm: 2100, coolantTemp: 93, mapKpa: 55, fuelTrimST: 0.8, fuelTrimLT: 1.2, vehicleSpeed: 48, engineLoad: 44 },
  },
  P0301: {
    description: 'Cylinder 1 Misfire Detected',
    system: 'powertrain',
    severity: DTC_SEVERITIES.CRITICAL,
    possibleCauses: [
      'Spark plug fouled or worn on cylinder 1',
      'Ignition coil on cylinder 1 failed',
      'Fuel injector on cylinder 1 restricted or failed',
      'Low compression on cylinder 1',
    ],
    freezeFrame: { rpm: 790, coolantTemp: 88, mapKpa: 36, fuelTrimST: 4.9, fuelTrimLT: 5.8, vehicleSpeed: 0, engineLoad: 23 },
  },
  C0035: {
    description: 'Left Front Wheel Speed Sensor Circuit',
    system: 'chassis',
    severity: DTC_SEVERITIES.CRITICAL,
    possibleCauses: [
      'Wheel speed sensor failed or damaged',
      'Wheel speed sensor wiring harness chafed or shorted',
      'Tone ring damaged or missing teeth',
      'Loose sensor connector',
      'ABS module fault',
    ],
    freezeFrame: { rpm: 1650, coolantTemp: 89, mapKpa: 48, fuelTrimST: 0.4, fuelTrimLT: 0.8, vehicleSpeed: 42, engineLoad: 40 },
  },
  C0040: {
    description: 'Right Front Wheel Speed Sensor Circuit',
    system: 'chassis',
    severity: DTC_SEVERITIES.CRITICAL,
    possibleCauses: [
      'Right front wheel speed sensor failed',
      'Damaged sensor wiring or connector',
      'Reluctor ring damaged',
      'ABS module fault',
    ],
    freezeFrame: { rpm: 1700, coolantTemp: 90, mapKpa: 47, fuelTrimST: 0.5, fuelTrimLT: 0.9, vehicleSpeed: 45, engineLoad: 41 },
  },
  B1001: {
    description: 'ECU Internal Fault',
    system: 'body',
    severity: DTC_SEVERITIES.MODERATE,
    possibleCauses: [
      'Body control module internal fault',
      'Low battery voltage causing BCM reset',
      'Software corruption — reflash may be required',
      'Ground circuit fault at BCM',
    ],
    freezeFrame: null,
  },
  U0100: {
    description: 'Lost Communication with ECM/PCM',
    system: 'network',
    severity: DTC_SEVERITIES.CRITICAL,
    possibleCauses: [
      'CAN bus open or short circuit',
      'ECM/PCM power or ground supply fault',
      'Damaged wiring in CAN network',
      'Failed ECM/PCM',
      'Terminating resistor fault',
    ],
    freezeFrame: null,
  },
};

// ---------------------------------------------------------------------------
// parseDTCCode
// ---------------------------------------------------------------------------

/**
 * Parses a DTC string and returns its system and category.
 *
 * @param {string} code  e.g. 'P0420'
 * @returns {{ code: string, system: string, category: string }}
 */
export function parseDTCCode(code) {
  if (!code || typeof code !== 'string') {
    return { code: code ?? '', system: 'unknown', category: 'unknown' };
  }

  const normalized = code.trim().toUpperCase();
  const prefix = normalized.charAt(0);
  const system = DTC_SYSTEMS[prefix] ?? 'unknown';

  // Second digit encodes the category within the system
  const digit2 = normalized.charAt(1);
  let category = 'generic';
  if (digit2 === '0') category = 'ISO/SAE generic';
  else if (digit2 === '1') category = 'manufacturer-specific';
  else if (digit2 === '2') category = 'ISO/SAE generic';
  else if (digit2 === '3') category = 'manufacturer-specific';

  return { code: normalized, system, category };
}

// ---------------------------------------------------------------------------
// enrichDTC
// ---------------------------------------------------------------------------

/**
 * Enriches a single DTC code with description, severity, causes, and
 * optional freeze frame data.
 *
 * @param {string}  dtcCode   e.g. 'P0420'
 * @param {boolean} demoMode  when true uses hardcoded library (default true)
 * @returns {Promise<DTCResult>}
 */
export async function enrichDTC(dtcCode, demoMode = true) {
  // Simulated OBD-II adapter / cloud API latency
  const delay = 200 + Math.floor(Math.random() * 200);
  await new Promise(resolve => setTimeout(resolve, delay));

  const normalized = dtcCode.trim().toUpperCase();
  const parsed = parseDTCCode(normalized);

  if (demoMode) {
    const entry = DTC_LIBRARY[normalized];

    if (entry) {
      return {
        code: normalized,
        description: entry.description,
        system: entry.system,
        severity: entry.severity,
        status: DTC_STATUSES.CONFIRMED,
        possibleCauses: entry.possibleCauses,
        freezeFrame: entry.freezeFrame ?? undefined,
      };
    }

    // Fallback for unknown codes in demo mode
    return {
      code: normalized,
      description: `${parsed.system.charAt(0).toUpperCase() + parsed.system.slice(1)} system fault — code not in demo library`,
      system: parsed.system,
      severity: DTC_SEVERITIES.INFORMATIONAL,
      status: DTC_STATUSES.PENDING,
      possibleCauses: ['Unknown — consult factory service data'],
      freezeFrame: undefined,
    };
  }

  // Live mode placeholder — swap in real OBD-II / cloud lookup here
  throw new Error('Live DTC enrichment not yet implemented. Use demoMode=true.');
}

// ---------------------------------------------------------------------------
// ingestDTCList
// ---------------------------------------------------------------------------

/**
 * Enriches an array of DTC strings and groups results by system.
 *
 * @param {string[]} dtcCodes   Array of DTC strings e.g. ['P0420', 'C0035']
 * @param {boolean}  demoMode
 * @returns {Promise<DTCResult[]>}   Flat array, ordered by system then code
 */
export async function ingestDTCList(dtcCodes, demoMode = true) {
  if (!Array.isArray(dtcCodes) || dtcCodes.length === 0) return [];

  const results = await Promise.all(
    dtcCodes.map(code => enrichDTC(code, demoMode))
  );

  // Sort: network > chassis > body > powertrain (critical systems first),
  // then alphabetically within each system.
  const systemOrder = ['network', 'chassis', 'body', 'powertrain'];
  results.sort((a, b) => {
    const sysA = systemOrder.indexOf(a.system);
    const sysB = systemOrder.indexOf(b.system);
    if (sysA !== sysB) return sysA - sysB;
    return a.code.localeCompare(b.code);
  });

  return results;
}

// ---------------------------------------------------------------------------
// getDemoDTCs
// ---------------------------------------------------------------------------

/**
 * Returns pre-seeded DTCResult[] for a demo VIN from the registry.
 * Returns an empty array if the VIN is not found or has no DTCs.
 *
 * @param {string} vin
 * @returns {DTCResult[]}
 */
export function getDemoDTCs(vin) {
  const entry = DEMO_REGISTRY[vin];
  if (!entry) return [];
  return Array.isArray(entry.dtcCodes) ? entry.dtcCodes : [];
}

// ---------------------------------------------------------------------------
// formatDTCForCause
// ---------------------------------------------------------------------------

/**
 * Formats a DTCResult for insertion into the Cause section of a 3C story.
 *
 * Example output:
 *   "Scan tool retrieved DTC [DTC-P0420] — Catalyst System Efficiency Below
 *    Threshold (Bank 1). Status: Confirmed. [DTC-P0420]"
 *
 * @param {DTCResult} dtcResult
 * @returns {string}
 */
export function formatDTCForCause(dtcResult) {
  const { code, description, status } = dtcResult;
  const tag = `[DTC-${code}]`;
  const statusLabel = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Unknown';
  return `Scan tool retrieved DTC ${tag} — ${description}. Status: ${statusLabel}. ${tag}`;
}

// ---------------------------------------------------------------------------
// parseCSVExport
// ---------------------------------------------------------------------------

/**
 * Parses a scan tool CSV export into an array of DTC code strings.
 * Expects columns: Code, Description, Status (first row is header).
 *
 * @param {string} csvText  Raw CSV text from a scan tool export
 * @returns {string[]}      Array of DTC code strings e.g. ['P0420', 'C0035']
 */
export function parseCSVExport(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header to find column index for 'Code'
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const codeIdx = headers.findIndex(h => h === 'code');

  if (codeIdx === -1) return [];

  const codes = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const rawCode = cols[codeIdx]?.trim();
    if (rawCode && /^[PBCU][0-9A-F]{4}$/i.test(rawCode)) {
      codes.push(rawCode.toUpperCase());
    }
  }

  return codes;
}

// ---------------------------------------------------------------------------
// groupBySystem
// ---------------------------------------------------------------------------

/**
 * Groups an array of DTCResult objects by their system field.
 *
 * @param {DTCResult[]} dtcResults
 * @returns {{ powertrain: DTCResult[], body: DTCResult[], chassis: DTCResult[], network: DTCResult[] }}
 */
export function groupBySystem(dtcResults) {
  const groups = {
    powertrain: [],
    body: [],
    chassis: [],
    network: [],
  };

  if (!Array.isArray(dtcResults)) return groups;

  for (const result of dtcResults) {
    const sys = result.system;
    if (groups[sys]) {
      groups[sys].push(result);
    }
  }

  return groups;
}
