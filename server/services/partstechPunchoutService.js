/**
 * WrenchIQ — PartsTech punch-out sessions: open PartsTech for a repair order, get back the parts
 * the advisor picked there.
 *
 * Flow:
 *   1. startSession() opens a PartsTech punch-out quote (partstech/searchParts.js) whose urls point
 *      back at this server, each carrying an unguessable `ref` we generate:
 *        callbackUrl      -> POST /api/partstech/callback/:ref         (cart changed)
 *        callbackOrderUrl -> POST /api/partstech/callback/:ref/order   (order placed in PartsTech)
 *        returnUrl        -> GET  /api/partstech/return/:ref           (advisor done, browser comes back)
 *   2. The advisor picks parts at the session's redirectUrl (PartsTech's own UI).
 *   3. On any callback or the return, refreshCart() re-reads the cart from PartsTech
 *      (/punchout/cart/info) and stores it; the UI reads it with getSession().
 *
 * The callback body is never trusted for parts or prices: PartsTech does not document it, and a
 * forged call could only make us re-read the real cart. The raw body is still logged on the session
 * (`callbacks`) so its real shape can be learned from live traffic.
 *
 * Callbacks need PARTSTECH_CALLBACK_BASE_URL, a public https origin PartsTech accepts (it verifies
 * callback urls at quote/create and rejects localhost). Without it the session is opened with empty
 * callback urls and parts come back only through returnUrl (the request's own origin) or a refresh.
 */

import { randomBytes } from 'crypto';
import { createQuote, getCart, getQuote, partstechSettings, searchUrlFor, resolvePartType, listShopSuppliers } from '../../partstech/searchParts.js';

const COLLECTION = 'partstech_sessions';
const MAX_CALLBACK_BODY = 20000; // chars of a raw callback body kept per call
const MAX_CALLBACKS = 50;        // callback log entries kept per session

const SUPPLIERS_TTL_MS = 10 * 60 * 1000;
let suppliersCache = null; // { at, list }

/** The suppliers on the shop's PartsTech account (cached 10 minutes). */
export async function shopSuppliers() {
  if (!suppliersCache || Date.now() - suppliersCache.at > SUPPLIERS_TTL_MS) suppliersCache = { at: Date.now(), list: await listShopSuppliers() };
  return suppliersCache.list;
}

const supplierKeyOf = name => String(name).toLowerCase().replace(/[^a-z]/g, '').replace(/autoparts$/, '');
/**
 * The shop's supplier order (names, e.g. ["NAPA", "O'Reilly"]) -> the first supplier in it that is set
 * up and approved on the PartsTech account: the supplier PartsTech opens on. null if none match.
 */
export function preferredSupplier(order, suppliers) {
  for (const name of order || []) {
    const k = supplierKeyOf(name);
    const hit = suppliers.find(s => s.status !== 'Rejected' && (supplierKeyOf(s.supplier).startsWith(k) || k.startsWith(supplierKeyOf(s.supplier))));
    if (hit) return { credentialId: hit.credentialId, supplier: hit.supplier, store: hit.store, asked: name };
  }
  return null;
}

export class PunchoutError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}

const coll = db => db.collection(COLLECTION);

export async function ensurePunchoutIndexes(db) {
  await coll(db).createIndex({ ref: 1 }, { unique: true });
  await coll(db).createIndex({ sessionId: 1 });
  await coll(db).createIndex({ roId: 1, createdAt: -1 });
}

/**
 * The three urls for a session. Callbacks are sent only with a public base url (PartsTech verifies
 * them and cannot reach localhost); returnUrl only needs to work in the advisor's browser.
 */
export function callbackUrls({ publicBaseUrl, browserBaseUrl }, ref) {
  const api = base => String(base).replace(/\/+$/, '') + '/api/partstech';
  return {
    callbackUrl: publicBaseUrl ? `${api(publicBaseUrl)}/callback/${ref}` : '',
    callbackOrderUrl: publicBaseUrl ? `${api(publicBaseUrl)}/callback/${ref}/order` : '',
    returnUrl: `${api(publicBaseUrl || browserBaseUrl)}/return/${ref}`,
  };
}

/** Session as the UI sees it: no raw callback bodies, just what was picked. */
function publicView(s) {
  if (!s) return null;
  return {
    ref: s.ref,
    sessionId: s.sessionId,
    roId: s.roId,
    redirectUrl: s.redirectUrl,
    searchUrl: s.searchUrl || null,
    query: s.query,
    requested: s.requested || [],
    supplierOrder: s.supplierOrder || [],
    preferredSupplier: s.preferredSupplier || null,
    status: s.status,
    createdAt: s.createdAt,
    cartUpdatedAt: s.cartUpdatedAt || null,
    orderedAt: s.orderedAt || null,
    returnedAt: s.returnedAt || null,
    orders: s.cart?.orders || [],
    parts: s.cart?.parts || [],
    callbackCount: s.callbacks?.length || 0,
    lastCallbackAt: s.callbacks?.at(-1)?.at || null,
  };
}

/**
 * Open a punch-out session for a vehicle + part.
 * @param {object} db
 * Several parts at once (q.parts: the repair order's part names) open ONE session searching all of
 * their PartsTech part types together; `requested` says which part type each name became, so the
 * parts the advisor picks can be matched back to the RO's lines.
 * q.supplierOrder: the shop's order of suppliers inside PartsTech (e.g. NAPA, then O'Reilly); the
 * session opens on the first one set up on the account (preferredSupplier).
 * @param {{vin?:string, year?:number, make?:string, model?:string, part?:string, parts?:string[], partTypeIds?:number[], supplierOrder?:string[], roId?:string}} q
 * @param {{publicBaseUrl?:string, browserBaseUrl:string}} bases  public origin PartsTech can call; origin the advisor's browser uses
 */
export async function startSession(db, q, bases) {
  if (!q.vin && !(q.year && q.make && q.model)) throw new PunchoutError('no_vehicle', 'A VIN or year, make and model are needed.');
  const names = [...new Set((q.parts || []).map(n => String(n).trim()).filter(Boolean))];
  if (!q.part && !names.length && !q.partTypeIds?.length) throw new PunchoutError('no_part', 'A part name or partTypeIds are needed.');

  const ref = randomBytes(16).toString('hex');
  const urls = callbackUrls(bases, ref);
  const vehicle = {
    vin: q.vin || undefined,
    year: q.vin ? undefined : Number(q.year),
    make: q.vin ? undefined : q.make,
    model: q.vin ? undefined : q.model,
  };
  // several parts: each name -> a PartsTech part type; the session searches them all
  let requested = [];
  if (names.length) {
    requested = await Promise.all(names.map(async name => ({ name, ...((await resolvePartType(name, vehicle)) || { partTypeId: null, how: 'no PartsTech part type matched' }) })));
  }
  const ids = [...new Set(requested.map(r => r.partTypeId).filter(Boolean))];
  const query = {
    ...vehicle,
    // nothing resolved: let PartsTech search the first name as typed
    keyword: q.part || (names.length && !ids.length ? names[0] : undefined),
    partTypeIds: q.partTypeIds?.length ? q.partTypeIds.map(Number) : ids.length ? ids : undefined,
  };
  // Stored before PartsTech is asked: quote/create verifies callbackUrl/callbackOrderUrl and may
  // call them while we wait, so the ref has to resolve already (handleCallback logs it as 'pending').
  const doc = {
    ref,
    sessionId: null,
    redirectUrl: null,
    roId: q.roId || null,
    query,
    requested,
    supplierOrder: Array.isArray(q.supplierOrder) ? q.supplierOrder.map(String) : [],
    preferredSupplier: Array.isArray(q.supplierOrder) && q.supplierOrder.length ? preferredSupplier(q.supplierOrder, await shopSuppliers().catch(() => [])) : null,
    urls,
    status: 'pending',
    createdAt: new Date(),
    cart: { orders: [], parts: [] },
    callbacks: [],
  };
  await coll(db).insertOne(doc);

  let quote;
  try { quote = await createQuote(query, urls); }
  catch (err) {
    await coll(db).updateOne({ ref }, { $set: { status: 'failed', error: err.message } });
    throw err;
  }
  // PartsTech's search page for the session, for opening it with a filter (the shop's parts rule) after sign-in
  const searchUrl = await searchUrlFor(quote.redirectUrl);
  const set = { sessionId: quote.sessionId, redirectUrl: quote.redirectUrl, searchUrl, query: { ...query, searchParams: quote.searchParams }, status: 'open' };
  await coll(db).updateOne({ ref }, { $set: set });
  return publicView({ ...doc, ...set });
}

export async function getSession(db, ref, { refresh = false } = {}) {
  const s = await coll(db).findOne({ ref });
  if (!s) throw new PunchoutError('not_found', 'No PartsTech session with that reference.', 404);
  return refresh ? refreshCart(db, s) : publicView(s);
}

/** Re-read the cart from PartsTech and store it. Takes the session doc or its ref. */
export async function refreshCart(db, sessionOrRef) {
  const s = typeof sessionOrRef === 'string' ? await coll(db).findOne({ ref: sessionOrRef }) : sessionOrRef;
  if (!s) throw new PunchoutError('not_found', 'No PartsTech session with that reference.', 404);
  const cart = await getCart(s.sessionId);
  const quote = await getQuote(s.sessionId).catch(() => null);
  const set = {
    cart: { orders: cart.orders, parts: cart.parts },
    cartUpdatedAt: new Date(),
    status: s.status === 'ordered' ? 'ordered' : quote?.quote?.submitted ? 'submitted' : cart.parts.length ? 'parts_selected' : 'open',
  };
  await coll(db).updateOne({ _id: s._id }, { $set: set });
  return publicView({ ...s, ...set });
}

/**
 * PartsTech sent the advisor back (returnUrl: "send to repair order" in PartsTech). Re-read the cart and
 * stamp returnedAt, which WrenchIQ watches to close PartsTech and bring the parts to the RO.
 */
export async function markReturned(db, ref) {
  const s = await coll(db).findOne({ ref });
  if (!s) throw new PunchoutError('not_found', 'No PartsTech session with that reference.', 404);
  const view = await refreshCart(db, s);
  const returnedAt = new Date();
  await coll(db).updateOne({ _id: s._id }, { $set: { returnedAt } });
  return { ...view, returnedAt };
}

/** Log a callback from PartsTech, then refresh the cart. kind: 'cart' | 'order'. */
export async function handleCallback(db, ref, kind, req) {
  const s = await coll(db).findOne({ ref });
  if (!s) throw new PunchoutError('not_found', 'No PartsTech session with that reference.', 404);
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
  const entry = {
    kind,
    at: new Date(),
    method: req.method,
    contentType: req.get('content-type') || null,
    query: req.query,
    body: raw.length > MAX_CALLBACK_BODY ? raw.slice(0, MAX_CALLBACK_BODY) + '…(truncated)' : raw,
  };
  // No sessionId yet: this is PartsTech verifying the url during quote/create. Log it, nothing to read.
  const set = kind === 'order' && s.sessionId ? { status: 'ordered', orderedAt: entry.at } : {};
  await coll(db).updateOne({ _id: s._id }, { $push: { callbacks: { $each: [entry], $slice: -MAX_CALLBACKS } }, $set: set });
  if (!s.sessionId) return publicView({ ...s, callbacks: [...(s.callbacks || []), entry] });
  return refreshCart(db, { ...s, ...set });
}

/**
 * Everything WrenchIQ uses to talk to PartsTech, for the Shop profile "PartsTech configuration" view.
 * Secrets are never returned: the partner and user keys are reported only as set or not.
 */
export function partstechConfig() {
  const c = partstechSettings(), publicBase = process.env.PARTSTECH_CALLBACK_BASE_URL || null;
  return {
    supplier: 'PartsTech',
    protocol: 'PartsTech API v2: JSON over HTTPS, bearer token from POST /oauth/access (1 hour)',
    auth: 'Partner ID and key plus the shop\'s user ID and key, from the server environment. Keys are never sent to the browser.',
    connection: {
      apiUrl: c.apiUrl,
      partnerId: c.partnerId,
      userId: c.userId,
      keysConfigured: c.keysConfigured,
    },
    callbacks: {
      publicBaseUrl: publicBase,
      enabled: !!publicBase,
      note: publicBase
        ? 'PartsTech calls /api/partstech/callback/:ref when the cart changes and /callback/:ref/order when an order is placed.'
        : 'Not set (PARTSTECH_CALLBACK_BASE_URL). Picked parts come back when the advisor returns from PartsTech or presses Refresh. PartsTech only accepts callback URLs it can verify, so localhost cannot be used.',
    },
    lookup: {
      steps: [
        'Vehicle → the VIN on the RO (or year, make and model)',
        'Part name → a PartsTech part type when the name matches one exactly, else a keyword search',
        'PartsTech opens with the search already run for that vehicle',
        'The advisor compares suppliers in PartsTech (AutoZone, NAPA, O\'Reilly ... as set up on the shop\'s PartsTech account) and adds parts to the cart',
        'WrenchIQ reads the cart back: part, brand, supplier, store, cost, list price, core and stock',
      ],
      mode: 'Punch-out: the advisor picks parts in PartsTech. The partner account has no catalog access, so WrenchIQ cannot price parts on its own.',
      ordering: 'Ordering stays in PartsTech under the shop\'s supplier accounts. WrenchIQ never places an order.',
    },
    pricing: 'Your cost from the supplier the advisor picked in PartsTech, with list price shown alongside. Never estimated.',
  };
}
