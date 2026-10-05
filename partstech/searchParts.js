#!/usr/bin/env node
/**
 * PartsTech API (v2) — part search client.
 *
 * Standalone script for now, the PartsTech counterpart of ../napa/searchParts.js; the plan is to
 * fold both into the server-side parts-lookup layer once the integration is wired into WrenchIQ.
 *
 * Protocol: JSON over HTTPS. POST /oauth/access with a partner id/key plus a user (shop) id/key
 * returns a bearer token (1 hour); every other call sends it. The keys are secrets: they come
 * from env vars only (PARTSTECH_PARTNER_ID / _PARTNER_KEY / _USER_ID / _USER_KEY, e.g. in
 * .env.local) and are never defaulted here.
 *
 * Two ways to get parts, depending on what the partner account is allowed to call:
 *   - Catalog (POST /catalog/quote): parts with price and stock straight back to us. Needs
 *     catalog access on the partner account; without it PartsTech answers 403
 *     "Access denied for the partner".
 *   - Punch-out (POST /punchout/quote/create): PartsTech returns a session and a redirectUrl.
 *     The advisor picks parts in PartsTech's own UI, then POST /punchout/cart/info returns what
 *     they picked, with supplier, store, cost, list, core and per-store stock.
 * searchParts() tries the catalog first and falls back to punch-out on that 403.
 *
 * Request shapes follow the PartsTech Postman collections in this folder (old/ = full v2.021
 * reference, new/ = the punch-out flow). Confirmed live 2026-10-05 with a punch-out-only
 * partner account: login, VIN decode, year/make/model lists, part types, quote create, cart info.
 */

const API_URL = process.env.PARTSTECH_API_URL || "https://api.partstech.com";
const SECRETS = ["PARTSTECH_PARTNER_ID", "PARTSTECH_PARTNER_KEY", "PARTSTECH_USER_ID", "PARTSTECH_USER_KEY"];

export class PartsTechError extends Error {
  constructor(code, message, status) { super(message); this.code = code; this.status = status; }
}

/** The connection settings in use. Keys are reported only as set or not, never their values. */
export function partstechSettings() {
  const src = name => (process.env[name] ? "env " + name : "default");
  return {
    apiUrl: { value: API_URL, source: src("PARTSTECH_API_URL") },
    partnerId: { value: process.env.PARTSTECH_PARTNER_ID || null, source: src("PARTSTECH_PARTNER_ID") },
    userId: { value: process.env.PARTSTECH_USER_ID || null, source: src("PARTSTECH_USER_ID") },
    keysConfigured: SECRETS.every(name => process.env[name]),
  };
}

let token = null; // { value, expiresAt }

async function login() {
  const missing = SECRETS.filter(name => !process.env[name]);
  if (missing.length) throw new PartsTechError("not_configured", `PartsTech credentials not set: ${missing.join(", ")}`);
  const res = await fetch(`${API_URL}/oauth/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessType: "user",
      credentials: {
        user: { id: process.env.PARTSTECH_USER_ID, key: process.env.PARTSTECH_USER_KEY },
        partner: { id: process.env.PARTSTECH_PARTNER_ID, key: process.env.PARTSTECH_PARTNER_KEY },
      },
    }),
  });
  const body = await readJson(res);
  if (!res.ok) throw apiError(res.status, body, "login");
  // Renew a minute early so a call never goes out with a token that expires in flight.
  token = { value: body.accessToken, expiresAt: Date.now() + (body.expiresIn - 60) * 1000 };
  return token.value;
}

async function readJson(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

/** PartsTech errors look like {error:{code,message}, validationErrors?:[...]}. */
function apiError(status, body, what) {
  const err = body?.error || {};
  const detail = [err.message, ...(body?.validationErrors || [])].filter(Boolean).join("; ") || String(body).slice(0, 300);
  const code = status === 403 ? "access_denied" : status === 401 ? "unauthorized" : err.code || "http_" + status;
  return new PartsTechError(code, `PartsTech ${what} HTTP ${status}: ${detail}`, status);
}

async function callApi(method, path, body) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const bearer = token && Date.now() < token.expiresAt ? token.value : await login();
    const res = await fetch(API_URL + path, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await readJson(res);
    // A token revoked before its expiry: log in again once, then give up.
    if (res.status === 401 && attempt === 0) { token = null; continue; }
    if (!res.ok) throw apiError(res.status, data, `${method} ${path.split("?")[0]}`);
    return data;
  }
}

/** VIN → PartsTech vehicle (vehicleId, year/make/model ids and names, engine). */
export async function decodeVin(vin) {
  return callApi("GET", `/taxonomy/vehicles/vin/${encodeURIComponent(vin)}`);
}

/** Every make PartsTech lists for a year. */
export async function listMakes(year) {
  const makes = await callApi("GET", `/taxonomy/vehicles/makes?year=${year}`);
  return makes.map(m => ({ id: m.makeId, desc: m.makeName }));
}

/** Every model PartsTech lists for a year and makeId. */
export async function listModels(year, makeId) {
  const models = await callApi("GET", `/taxonomy/vehicles/models?year=${year}&make=${makeId}`);
  return models.map(m => ({ id: m.modelId, desc: m.modelName }));
}

/**
 * Resolve Year + Make + Model names to PartsTech's vehicleParams ids. Without submodel and engine,
 * a punch-out session opens on PartsTech's submodel/engine picker rather than on results, so
 * prefer a VIN whenever the RO has one.
 */
export async function findVehicle({ year, make, model }) {
  const mk = (await listMakes(year)).find(m => m.desc.toLowerCase() === make.toLowerCase());
  if (!mk) throw new PartsTechError("fitment_not_found", `PartsTech does not list a ${year} ${make}`);
  const md = (await listModels(year, mk.id)).find(m => m.desc.toLowerCase() === model.toLowerCase());
  if (!md) throw new PartsTechError("fitment_not_found", `PartsTech does not list a ${year} ${make} ${model}`);
  return { yearId: Number(year), makeId: mk.id, modelId: md.id };
}

/** Part types whose name contains `name` (e.g. "brake pad" → Disc Brake Pad Set 1684, Disc Brake Pad 63062, ...). */
export async function findPartTypes(name) {
  const types = await callApi("GET", `/taxonomy/part-types?name=${encodeURIComponent(name)}&perPage=50`);
  return (types || []).map(t => ({ id: t.partTypeId, name: t.partTypeName, description: t.description }));
}

/**
 * searchParams for a vehicle + what to look for. The vehicle is a VIN or {year, make, model};
 * the parts are partTypeIds when the name matches a PartsTech part type exactly, else the keyword.
 */
async function buildSearchParams({ vin, year, make, model, keyword, partTypeIds }) {
  const params = {};
  if (vin) params.vin = vin;
  else if (year && make && model) params.vehicleParams = await findVehicle({ year, make, model });
  else throw new PartsTechError("no_vehicle", "A VIN or year, make and model are needed to check fitment.");

  if (partTypeIds?.length) params.partTypeIds = partTypeIds.map(Number);
  else if (keyword) {
    // An exact part-type name is a precise fitment search; anything else goes to PartsTech's keyword search.
    const exact = (await findPartTypes(keyword)).find(t => t.name.toLowerCase() === keyword.toLowerCase());
    if (exact) params.partTypeIds = [exact.id];
    else params.keyword = keyword;
  } else throw new PartsTechError("no_part", "A keyword or partTypeIds are needed.");
  return params;
}

/** Catalog quote: parts with price and stock. Throws code "access_denied" if the partner has no catalog access. */
export async function quoteParts(query) {
  const searchParams = await buildSearchParams(query);
  const res = await callApi("POST", "/catalog/quote", { searchParams, ...(query.storeId ? { storeId: query.storeId } : {}), filters: [] });
  return { searchParams, parts: res?.parts || [] };
}

/**
 * Punch-out quote session. `urls` tells PartsTech where to send the advisor back (returnUrl) and
 * where to post cart/order updates (callbackUrl, callbackOrderUrl); empty strings are accepted
 * for testing but a real integration needs at least returnUrl.
 */
export async function createQuote(query, urls = { callbackUrl: "", callbackOrderUrl: "", returnUrl: "" }) {
  const searchParams = await buildSearchParams(query);
  const res = await callApi("POST", "/punchout/quote/create", { searchParams, urls });
  return { searchParams, sessionId: res.sessionId, redirectUrl: res.redirectUrl };
}

/** Quote session status: OPEN / submitted, and the urls it was created with. */
export async function getQuote(sessionId) {
  return callApi("POST", "/punchout/quote/info", { sessionId });
}

/** What the advisor picked in a punch-out session, one row per part. */
export async function getCart(sessionId) {
  const res = await callApi("POST", "/punchout/cart/info", { sessionId });
  const orders = res?.orders || [];
  return {
    sessionId,
    redirectUrl: res?.redirectUrl,
    orders: orders.map(o => ({
      supplier: o.supplier?.name,
      store: o.store?.name,
      delivery: o.delivery?.name,
      totalPrice: o.totalPrice,
      tax: o.tax,
      shippingPrice: o.shippingPrice,
    })),
    parts: orders.flatMap(o => (o.parts || []).map(p => toRow(p, o))),
  };
}

/** Remove parts from a punch-out cart by their orderItemId (from getCart). */
export async function removeCartParts(sessionId, orderItemIds) {
  return callApi("POST", "/punchout/cart/remove-parts", { sessionId, removals: orderItemIds });
}

/** A PartsTech part (from cart info or catalog quote) as a flat row, same idea as the NAPA service's toRow. */
export function toRow(part, order) {
  const attr = name => part.attributes?.find(a => a.name === name)?.value || "";
  const stores = part.storesAvailability || [];
  return {
    supplier: order?.supplier?.name || "PartsTech",
    store: order?.store?.name || null,
    orderItemId: part.orderItemId || null,
    partId: part.partId,
    lineCardId: part.lineCardId,
    partNumber: String(part.partNumber ?? ""),
    description: String(part.partName ?? ""),
    brand: part.brand?.displayName || part.brand?.brandName || "",
    partType: part.taxonomy?.partTypeName || "",
    position: attr("Position"),
    quantity: part.quantity ?? null,
    // price.price is the shop's cost from this supplier; list is the supplier's list price.
    cost: Number(part.price?.price) > 0 ? Number(part.price.price) : null,
    listPrice: Number(part.price?.list) > 0 ? Number(part.price.list) : null,
    core: Number(part.price?.core) || 0,
    fet: Number(part.price?.fet) || 0,
    inStock: part.availability === true,
    backOrder: part.backOrder === true,
    homeStoreQty: stores.find(s => s.main)?.quantity ?? null,
    warranty: attr("WarrantyTime"),
    vehicle: part.vehicleName || "",
  };
}

/**
 * High-level search: VIN (or year/make/model) + keyword (or partTypeIds) → parts.
 * With catalog access, returns priced parts. Without it, opens a punch-out session instead and
 * returns its redirectUrl; call getCart(sessionId) after the advisor picks parts there.
 */
export async function searchParts(query) {
  try {
    const { searchParams, parts } = await quoteParts(query);
    return { mode: "catalog", searchParams, parts: parts.map(p => toRow(p)) };
  } catch (err) {
    if (err.code !== "access_denied") throw err;
    const quote = await createQuote(query, query.urls);
    return { mode: "punchout", ...quote, parts: [], note: "No catalog access for this partner: pick parts at redirectUrl, then read the cart." };
  }
}

function formatRow(r) {
  const lines = [
    `${r.brand} ${r.partNumber} — ${r.description}${r.position ? ` (${r.position})` : ""}${r.quantity ? `  x${r.quantity}` : ""}`,
    `  Cost: ${r.cost != null ? "$" + r.cost.toFixed(2) : "—"}  List: ${r.listPrice != null ? "$" + r.listPrice.toFixed(2) : "—"}${r.core ? `  Core: $${r.core}` : ""}  ${r.inStock ? "In stock" : "Out of stock"}${r.homeStoreQty != null ? ` (${r.homeStoreQty} at home store)` : ""}`,
    `  ${r.supplier}${r.store ? " · " + r.store : ""}${r.orderItemId ? "  orderItemId " + r.orderItemId : ""}`,
  ];
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i]?.replace(/^--/, "")] = argv[i + 1];
  return args;
}

const USAGE = `Usage:
  node partstech/searchParts.js --vin 4T1B11HK7JU512345 --keyword "Disc Brake Pad Set"
  node partstech/searchParts.js --year 2018 --make Toyota --model Camry --keyword "brake pads"
  node partstech/searchParts.js --vin 4T1B11HK7JU512345 --partTypeIds 1684,63062
  node partstech/searchParts.js --cart <sessionId>
  node partstech/searchParts.js --remove <sessionId> --items <orderItemId,...>
Credentials: PARTSTECH_PARTNER_ID, PARTSTECH_PARTNER_KEY, PARTSTECH_USER_ID, PARTSTECH_USER_KEY
(e.g. node --env-file=.env.local partstech/searchParts.js ...)`;

async function main() {
  const a = parseArgs(process.argv.slice(2));

  if (a.cart) {
    const cart = await getCart(a.cart);
    console.log(`PartsTech cart ${cart.sessionId}: ${cart.parts.length} part(s)\n`);
    if (!cart.parts.length) console.log(`Empty. Pick parts at ${cart.redirectUrl}`);
    for (const o of cart.orders) console.log(`${o.supplier} · ${o.store} · ${o.delivery}: total $${o.totalPrice}`);
    console.log();
    for (const r of cart.parts) console.log(formatRow(r) + "\n");
    return;
  }

  if (a.remove) {
    if (!a.items) { console.error(USAGE); process.exit(1); }
    await removeCartParts(a.remove, a.items.split(","));
    console.log(`Removed ${a.items.split(",").length} item(s) from cart ${a.remove}`);
    return;
  }

  const partTypeIds = a.partTypeIds ? a.partTypeIds.split(",") : undefined;
  if (!(a.vin || (a.year && a.make && a.model)) || !(a.keyword || partTypeIds)) {
    console.error(USAGE);
    process.exit(1);
  }

  const vehicle = a.vin || `${a.year} ${a.make} ${a.model}`;
  console.log(`Searching PartsTech: ${vehicle} — ${a.keyword ? `"${a.keyword}"` : `part types ${partTypeIds.join(", ")}`}\n`);
  if (a.vin) {
    const v = await decodeVin(a.vin);
    console.log(`Vehicle: ${v.yearId} ${v.makeName} ${v.modelName} ${v.subModelName} ${v.engineName} (vehicleId ${v.vehicleId})`);
  }
  const result = await searchParts({ vin: a.vin, year: a.year && Number(a.year), make: a.make, model: a.model, keyword: a.keyword, partTypeIds });
  console.log(`Search: ${JSON.stringify(result.searchParams)}\n`);

  if (result.mode === "punchout") {
    console.log(result.note);
    console.log(`  sessionId:   ${result.sessionId}`);
    console.log(`  redirectUrl: ${result.redirectUrl}`);
    console.log(`\nThen: node partstech/searchParts.js --cart ${result.sessionId}`);
    return;
  }
  console.log(`${result.parts.length} part(s) found:\n`);
  for (const r of result.parts) console.log(formatRow(r) + "\n");
}

// Only auto-run when invoked directly (`node searchParts.js ...`), not when imported as a module.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("PartsTech search failed:", err.message);
    process.exit(1);
  });
}
