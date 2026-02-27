// ============================================================
// NHTSA API Service — VIN Decoder + Recalls + Complaints
// Free API, no authentication required, open CORS
// ============================================================

const VIN_DECODE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";
const RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";
const COMPLAINTS_URL = "https://api.nhtsa.gov/complaints/complaintsByVehicle";

// Simple in-memory cache to avoid repeat API calls
const cache = new Map();

function cacheKey(prefix, ...args) {
  return `${prefix}:${args.join(":")}`;
}

/**
 * Decode a VIN using NHTSA vPIC API
 * Returns flat object with ~140 fields (Make, Model, Year, Engine, etc.)
 */
export async function decodeVIN(vin) {
  const key = cacheKey("vin", vin);
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(`${VIN_DECODE_URL}/${vin}?format=json`);
    const data = await res.json();
    const result = data.Results?.[0] || null;
    if (result) {
      // Clean up: remove empty string fields for cleaner display
      const cleaned = {};
      for (const [k, v] of Object.entries(result)) {
        if (v && v !== "" && v !== "Not Applicable") {
          cleaned[k] = v;
        }
      }
      cache.set(key, cleaned);
      return cleaned;
    }
    return null;
  } catch (err) {
    console.error("NHTSA VIN decode error:", err);
    return null;
  }
}

/**
 * Get recalls for a vehicle by make/model/year
 */
export async function getRecalls(make, model, modelYear) {
  const key = cacheKey("recalls", make, model, modelYear);
  if (cache.has(key)) return cache.get(key);

  try {
    const params = new URLSearchParams({ make, model, modelYear: String(modelYear) });
    const res = await fetch(`${RECALLS_URL}?${params}`);
    const data = await res.json();
    const results = data.results || [];
    cache.set(key, results);
    return results;
  } catch (err) {
    console.error("NHTSA recalls error:", err);
    return [];
  }
}

/**
 * Get consumer complaints for a vehicle by make/model/year
 */
export async function getComplaints(make, model, modelYear) {
  const key = cacheKey("complaints", make, model, modelYear);
  if (cache.has(key)) return cache.get(key);

  try {
    const params = new URLSearchParams({ make, model, modelYear: String(modelYear) });
    const res = await fetch(`${COMPLAINTS_URL}?${params}`);
    const data = await res.json();
    const results = data.results || [];
    cache.set(key, results);
    return results;
  } catch (err) {
    console.error("NHTSA complaints error:", err);
    return [];
  }
}

/**
 * Batch decode multiple VINs (up to 50)
 */
export async function batchDecodeVINs(vins) {
  const data = vins.map((vin) => vin).join(";");
  try {
    const res = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `DATA=${encodeURIComponent(data)}&format=json`,
      }
    );
    const json = await res.json();
    return json.Results || [];
  } catch (err) {
    console.error("NHTSA batch decode error:", err);
    return [];
  }
}

/**
 * Format a VIN decode result for display
 */
export function formatVINResult(result) {
  if (!result) return null;
  return {
    make: result.Make,
    model: result.Model,
    year: result.ModelYear,
    trim: result.Trim,
    bodyClass: result.BodyClass,
    engine: `${result.DisplacementL || ""}L ${result.EngineCylinders || ""}-Cyl ${result.FuelTypePrimary || ""}`.trim(),
    engineModel: result.EngineModel,
    horsepower: result.EngineHP,
    transmission: `${result.TransmissionSpeeds || ""}-Speed ${result.TransmissionStyle || ""}`.trim(),
    drivetrain: result.DriveType,
    doors: result.Doors,
    plant: `${result.PlantCity || ""}, ${result.PlantState || ""}, ${result.PlantCountry || ""}`.replace(/, ,/g, ",").trim(),
    manufacturer: result.ManufacturerName,
    abs: result.ABS,
    esc: result.ESC,
    tpms: result.TPMS,
    airbags: {
      front: result.AirBagLocFront,
      side: result.AirBagLocSide,
      curtain: result.AirBagLocCurtain,
    },
    errorCode: result.ErrorCode,
    errorText: result.ErrorText,
  };
}
