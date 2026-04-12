// ============================================================
// AM 3C VIN Intelligence Service — AE-866
// Decodes VINs via NHTSA vPIC API and enriches RO context
// with YMME data. Supports demo mode with hardcoded lookups.
// No external dependencies — uses native fetch only.
// ============================================================

const NHTSA_BASE_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin";

const VIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================
// Exported cache — keyed by VIN, value: { result, timestamp }
// ============================================================
export const VIN_CACHE = new Map();

// ============================================================
// NHTSA field name → our schema field mapping
// ============================================================
export const NHTSA_FIELD_MAP = {
  ModelYear: "year",
  Make: "make",
  Model: "model",
  Trim: "trim",
  DisplacementL: "engine",
  TransmissionStyle: "transmission",
  DriveType: "driveType",
  FuelTypePrimary: "fuelType",
};

// ============================================================
// Demo VIN lookup table — 10 hardcoded vehicles
// ============================================================
const DEMO_VIN_DATA = {
  "4T1B11HK6KU123456": {
    vin: "4T1B11HK6KU123456",
    year: "2019",
    make: "Toyota",
    model: "Camry",
    trim: "SE",
    engine: "2.5",
    transmission: "Automatic",
    driveType: "FWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "5J6RW2H59MA234567": {
    vin: "5J6RW2H59MA234567",
    year: "2021",
    make: "Honda",
    model: "CR-V",
    trim: "EX",
    engine: "1.5",
    transmission: "CVT",
    driveType: "AWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "1FTFW1E54JKC345678": {
    vin: "1FTFW1E54JKC345678",
    year: "2018",
    make: "Ford",
    model: "F-150",
    trim: "XLT",
    engine: "3.5",
    transmission: "Automatic",
    driveType: "4WD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "1GCRYDED8LZ456789": {
    vin: "1GCRYDED8LZ456789",
    year: "2020",
    make: "Chevrolet",
    model: "Silverado 1500",
    trim: "LT",
    engine: "5.3",
    transmission: "Automatic",
    driveType: "4WD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "4S4BSANC4H3567890": {
    vin: "4S4BSANC4H3567890",
    year: "2017",
    make: "Subaru",
    model: "Outback",
    trim: "2.5i",
    engine: "2.5",
    transmission: "CVT",
    driveType: "AWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "2T3RWRFV5NW678901": {
    vin: "2T3RWRFV5NW678901",
    year: "2022",
    make: "Toyota",
    model: "RAV4",
    trim: "XLE",
    engine: "2.5",
    transmission: "Automatic",
    driveType: "AWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "1HGCR2F87GA789012": {
    vin: "1HGCR2F87GA789012",
    year: "2016",
    make: "Honda",
    model: "Accord",
    trim: "EX-L",
    engine: "2.4",
    transmission: "Automatic",
    driveType: "FWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "1C4RJFAG6KC890123": {
    vin: "1C4RJFAG6KC890123",
    year: "2019",
    make: "Jeep",
    model: "Grand Cherokee",
    trim: "Laredo",
    engine: "3.6",
    transmission: "Automatic",
    driveType: "4WD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "1FM5K8GC0LGA90123": {
    vin: "1FM5K8GC0LGA90123",
    year: "2020",
    make: "Ford",
    model: "Explorer",
    trim: "ST",
    engine: "3.0",
    transmission: "Automatic",
    driveType: "AWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
  "1N4AL3AP1JC012345": {
    vin: "1N4AL3AP1JC012345",
    year: "2018",
    make: "Nissan",
    model: "Altima",
    trim: "SV",
    engine: "2.5",
    transmission: "CVT",
    driveType: "FWD",
    fuelType: "Gasoline",
    source: "demo",
    cached: false,
  },
};

// ============================================================
// Internal helpers
// ============================================================

/**
 * Extract a named field value from NHTSA Results array.
 * The vPIC single-VIN endpoint returns an array of { Variable, Value } objects.
 */
function extractField(results, fieldName) {
  const entry = results.find((r) => r.Variable === fieldName);
  const val = entry?.Value;
  if (!val || val === "" || val === "Not Applicable" || val === "0") {
    return null;
  }
  return val;
}

/**
 * Map raw NHTSA Results array to our normalized schema.
 */
function mapNHTSAResults(vin, results) {
  const get = (field) => extractField(results, field);

  return {
    vin,
    year: get("Model Year"),
    make: get("Make"),
    model: get("Model"),
    trim: get("Trim") || get("Trim2"),
    engine: get("Displacement (L)"),
    transmission: get("Transmission Style"),
    driveType: get("Drive Type"),
    fuelType: get("Fuel Type - Primary"),
    source: "nhtsa",
    cached: false,
  };
}

/**
 * Build a fallback DMS-format result when the API is unavailable.
 */
function buildDMSFallback(vin) {
  return {
    vin,
    year: null,
    make: null,
    model: null,
    trim: null,
    engine: null,
    transmission: null,
    driveType: null,
    fuelType: null,
    source: "dms",
    cached: false,
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Decode a VIN and return normalized YMME + technical data.
 *
 * @param {string} vin - 17-character VIN
 * @param {boolean} demoMode - If true, returns deterministic local data
 * @returns {Promise<object>} Normalized VIN result object
 */
export async function decodeVIN(vin, demoMode = false) {
  const normalizedVIN = (vin || "").trim().toUpperCase();

  // --- Demo mode: deterministic local lookup ---
  if (demoMode) {
    const demo = DEMO_VIN_DATA[normalizedVIN];
    if (demo) {
      return { ...demo, cached: false };
    }
    // Unknown VIN in demo mode: return DMS fallback
    return buildDMSFallback(normalizedVIN);
  }

  // --- Check cache (24h TTL) ---
  if (VIN_CACHE.has(normalizedVIN)) {
    const cached = VIN_CACHE.get(normalizedVIN);
    const age = Date.now() - cached.timestamp;
    if (age < VIN_CACHE_TTL_MS) {
      return { ...cached.result, cached: true };
    }
    // Expired — remove so we re-fetch
    VIN_CACHE.delete(normalizedVIN);
  }

  // --- Fetch from NHTSA vPIC ---
  try {
    const url = `${NHTSA_BASE_URL}/${encodeURIComponent(normalizedVIN)}?format=json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error(
        `[am3cVINService] NHTSA returned HTTP ${response.status} for VIN ${normalizedVIN}`
      );
      return buildDMSFallback(normalizedVIN);
    }

    const data = await response.json();
    const results = data?.Results;

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`[am3cVINService] No results from NHTSA for VIN ${normalizedVIN}`);
      return buildDMSFallback(normalizedVIN);
    }

    const mapped = mapNHTSAResults(normalizedVIN, results);

    // Cache with timestamp
    VIN_CACHE.set(normalizedVIN, { result: mapped, timestamp: Date.now() });

    return { ...mapped, cached: false };
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`[am3cVINService] NHTSA request timed out for VIN ${normalizedVIN}`);
    } else {
      console.error(`[am3cVINService] NHTSA fetch error for VIN ${normalizedVIN}:`, err);
    }
    return buildDMSFallback(normalizedVIN);
  }
}

/**
 * Clear all entries from the VIN cache.
 */
export function clearVINCache() {
  VIN_CACHE.clear();
}

/**
 * Format a VIN decode result into a human-readable display string.
 * Example: "2019 Toyota Camry SE | 2.5L | FWD | Gasoline"
 *
 * @param {object} result - Normalized VIN result from decodeVIN()
 * @returns {string} Formatted display string
 */
export function formatVINResult(result) {
  if (!result) return "";

  const parts = [];

  // YMME segment
  const ymme = [result.year, result.make, result.model, result.trim]
    .filter(Boolean)
    .join(" ");
  if (ymme) parts.push(ymme);

  // Engine displacement
  if (result.engine) {
    parts.push(`${result.engine}L`);
  }

  // Drive type
  if (result.driveType) {
    parts.push(result.driveType);
  }

  // Fuel type
  if (result.fuelType) {
    parts.push(result.fuelType);
  }

  return parts.join(" | ");
}
