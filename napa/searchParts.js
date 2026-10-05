#!/usr/bin/env node
/**
 * NAPA XML Parts Catalog Server (NXPCS) — part search client.
 *
 * Standalone script for now; the plan is to fold this into the server-side
 * parts-lookup layer alongside PartsTech (see ../partstech/) once the
 * integration is wired into WrenchIQ proper.
 *
 * Protocol: plain XML over HTTP POST (no OAuth/API keys — see
 * ../napa/"NAPA XML Parts Catalog Server Spec v6.1.1 1.docx"). Every request
 * needs a DCID/CountryID/CustomerTypeID (account-level identifiers, not
 * secrets) plus a Year/Make/Model vehicle identifier — NAPA's keyword search
 * is vehicle-fitment-scoped, not a bare keyword search.
 *
 * Connection values below come from the working production config at
 * /opt/predii/p360/application/conf/application.yaml (napa store) — confirmed
 * live against the real catalog server while building this script. Override
 * via env vars; defaults match that config so this runs out of the box.
 */

import { XMLParser, XMLBuilder } from "fast-xml-parser";

const CATALOG_API_URL = process.env.NAPA_CATALOG_API_URL || "http://www.napaecat.com/scripts/TRACSPPCatalogServ.dll";
const DC_ID = process.env.NAPA_DC_ID || "59";
const COUNTRY_ID = process.env.NAPA_COUNTRY_ID || "1"; // US
const CUSTOMER_TYPE_ID = process.env.NAPA_CUSTOMER_TYPE_ID || "1"; // Standard
const VEHICLE_TYPE_ID = "1"; // Automobile/Light Truck

/** The connection settings in use, and whether each came from the environment or the default. */
export function catalogSettings() {
  const src = name => (process.env[name] ? "env " + name : "default");
  return {
    catalogApiUrl: { value: CATALOG_API_URL, source: src("NAPA_CATALOG_API_URL") },
    dcId: { value: DC_ID, source: src("NAPA_DC_ID") },
    countryId: { value: COUNTRY_ID, source: src("NAPA_COUNTRY_ID") },
    customerTypeId: { value: CUSTOMER_TYPE_ID, source: src("NAPA_CUSTOMER_TYPE_ID") },
    vehicleTypeId: { value: VEHICLE_TYPE_ID, source: "fixed in code" },
  };
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });
const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: "@" });

/** Every NXPCS request is `<?xml version="1.0" ?>` + one root element. */
function toXml(rootName, body) {
  return `<?xml version="1.0" ?>\n${builder.build({ [rootName]: body })}`;
}

async function callApi(rootName, body) {
  const xml = toXml(rootName, body);
  const res = await fetch(CATALOG_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`NAPA catalog API HTTP ${res.status}: ${text.slice(0, 500)}`);
  return parser.parse(text);
}

/** NXPCS returns a single object instead of an array when there's only one item. */
function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function checkStatus(response, responseKey) {
  const node = response[responseKey];
  const statusCode = node?.["@StatusCode"];
  if (statusCode !== "0") {
    throw new Error(`NAPA ${responseKey} StatusCode=${statusCode}: ${node?.["@StatusMessage"] || "(no message)"}`);
  }
  return node;
}

/** Every make NAPA lists for a year. Trucks and SUVs are separate makes ("Ford" vs "Ford Truck"). */
export async function listMakes(year) {
  const response = await callApi("MakeListRequest", { VehYear: year, VehicleTypeID: VEHICLE_TYPE_ID });
  const node = checkStatus(response, "MakeListResponse");
  return asArray(node.MakeItem).map((m) => ({ id: m.MakeID, desc: String(m.MakeDesc) }));
}

/** Every model NAPA lists for a year and MakeID. */
export async function listModels(year, makeId) {
  const response = await callApi("ModelListRequest", { VehYear: year, MakeID: makeId, VehicleTypeID: VEHICLE_TYPE_ID });
  const node = checkStatus(response, "ModelListResponse");
  return asArray(node.ModelItem).map((m) => ({ id: m.ModelID, desc: String(m.ModelDesc) }));
}

/** Resolve a Year + Make name to NAPA's MakeID. */
export async function findMakeId(year, makeName) {
  const response = await callApi("MakeListRequest", { VehYear: year, VehicleTypeID: VEHICLE_TYPE_ID });
  const node = checkStatus(response, "MakeListResponse");
  const match = asArray(node.MakeItem).find((m) => String(m.MakeDesc).toLowerCase() === makeName.toLowerCase());
  if (!match) throw new Error(`No MakeID found for "${makeName}" in ${year}`);
  return match.MakeID;
}

/** Resolve a Year + MakeID + Model name to NAPA's ModelID. */
export async function findModelId(year, makeId, modelName) {
  const response = await callApi("ModelListRequest", { VehYear: year, MakeID: makeId, VehicleTypeID: VEHICLE_TYPE_ID });
  const node = checkStatus(response, "ModelListResponse");
  const match = asArray(node.ModelItem).find((m) => String(m.ModelDesc).toLowerCase() === modelName.toLowerCase());
  if (!match) throw new Error(`No ModelID found for "${modelName}" (${year}, makeId=${makeId})`);
  return match.ModelID;
}

/**
 * Keyword search, filtered to the vehicle-specific matches (VehCode "Y") —
 * same filter the p360 NAPA store implementation uses, since the non-vehicle
 * ("N") keywords are catalog-wide synonyms with no fitment guarantee.
 */
export async function findKeywords(keyword, vehicleItem) {
  const response = await callApi("KeywordListRequest", { Keyword: keyword, VehicleItem: vehicleItem });
  const node = checkStatus(response, "KeywordListResponse");
  return asArray(node.KeywordListItem).filter((k) => k.VehCode === "Y");
}

/** Parts matching one resolved KeywordDesc, for the given vehicle. */
export async function lookupPartsByKeyword(keywordDesc, vehicleItem) {
  const response = await callApi("PartApplicationLookupRequest", {
    DCID: DC_ID,
    CustomerTypeID: CUSTOMER_TYPE_ID,
    CountryID: COUNTRY_ID,
    VehicleItem: vehicleItem,
    LookupItem: { KeywordDesc: keywordDesc },
  });
  const node = checkStatus(response, "PartApplicationLookupResponse");
  return asArray(node.PartApplicationLookupItem);
}

/**
 * High-level search: Year/Make/Model + a free-text keyword (wildcards via
 * "*" supported, e.g. "*brake*pad*") → matching parts for that vehicle.
 *
 * Mirrors the flow in /opt/predii/p360/application/llm/store/napa.py
 * (__getPartsKeywordSearch), minus VIN decoding — callers here already know
 * the vehicle's Year/Make/Model (e.g. from a WrenchIQ RO).
 */
export async function searchParts({ year, make, model, keyword }) {
  const makeId = await findMakeId(year, make);
  const modelId = await findModelId(year, makeId, model);
  const vehicleItem = { VehYear: year, MakeID: makeId, ModelID: modelId };

  const keywords = await findKeywords(keyword, vehicleItem);
  if (!keywords.length) return { vehicleItem: { ...vehicleItem, make, model }, matchedKeywords: [], parts: [] };

  const partsByKeyword = await Promise.all(keywords.map((k) => lookupPartsByKeyword(k.KeywordDesc, vehicleItem)));
  return {
    vehicleItem: { ...vehicleItem, make, model },
    matchedKeywords: keywords.map((k) => k.KeywordDesc),
    parts: partsByKeyword.flat(),
  };
}

function formatPart(part) {
  const lines = [
    `${part.LineCode} ${part.PartNumber} — ${part.Description}`,
    `  List price: $${part.ListPrice}${part.Core && part.Core !== "0.0" ? `  Core: $${part.Core}` : ""}  Warranty: ${part.Warranty || "—"}`,
  ];
  if (part.Comment) lines.push(`  ${part.Comment}`);
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    args[key] = argv[i + 1];
  }
  return args;
}

async function main() {
  const { year, make, model, keyword } = parseArgs(process.argv.slice(2));
  if (!year || !make || !model || !keyword) {
    console.error('Usage: node searchParts.js --year 2015 --make Toyota --model Camry --keyword "disc brake pad"');
    process.exit(1);
  }

  console.log(`Searching NAPA catalog: ${year} ${make} ${model} — "${keyword}"\n`);
  const result = await searchParts({ year: Number(year), make, model, keyword });

  if (!result.matchedKeywords.length) {
    console.log(`No vehicle-specific NAPA keywords matched "${keyword}" for this vehicle.`);
    return;
  }

  console.log(`Matched NAPA keywords: ${result.matchedKeywords.join(", ")}\n`);
  console.log(`${result.parts.length} part(s) found:\n`);
  for (const part of result.parts) {
    console.log(formatPart(part));
    console.log();
  }
}

// Only auto-run when invoked directly (`node searchParts.js ...`), not when imported as a module.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("NAPA search failed:", err.message);
    process.exit(1);
  });
}
