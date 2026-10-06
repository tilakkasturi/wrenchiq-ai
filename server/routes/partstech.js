/**
 * WrenchIQ — PartsTech punch-out: open PartsTech for an RO and receive the parts picked there.
 *
 * GET  /api/partstech/config            -> connection + flow for the Shop profile config card (no secrets)
 * GET  /api/partstech/suppliers          -> suppliers on the shop's PartsTech account (PartsTech is the aggregator)
 * POST /api/partstech/sessions          { vin | year+make+model, part | parts[] | partTypeIds, supplierOrder?, roId? }
 *   -> { ref, sessionId, redirectUrl, status, parts: [] }   open redirectUrl for the advisor
 * GET  /api/partstech/sessions/:ref     ?refresh=1 re-reads the cart from PartsTech first
 *   -> { ref, status, orders, parts: [...], cartUpdatedAt, ... }
 *
 * Called by PartsTech (urls set on the session; see services/partstechPunchoutService.js):
 * ALL  /api/partstech/callback/:ref         callbackUrl       -> cart re-read and stored
 * ALL  /api/partstech/callback/:ref/order   callbackOrderUrl  -> marked ordered, cart re-read
 * GET  /api/partstech/return/:ref           returnUrl         -> cart re-read, page that hands the
 *                                                                parts back to the WrenchIQ window
 *
 * Callbacks answer {"Status":"SUCCESS"}, the body PartsTech's own sample callback url returns.
 * PartsTech verifies callbackUrl/callbackOrderUrl at quote/create (400 UnverifiedCallbackURLRegistration
 * for localhost, example.com and httpbin; its sample url passes), so the callback base url must be a
 * public origin PartsTech accepts; returnUrl is not verified and may be localhost.
 */

import express, { Router } from 'express';
import { startSession, getSession, handleCallback, markReturned, partstechConfig, shopSuppliers, PunchoutError } from '../services/partstechPunchoutService.js';
import { PartsTechError } from '../../partstech/searchParts.js';

const router = Router();

/** PartsTech's sample callback url answers this to every method; ours does the same. */
const ACK = { Status: 'SUCCESS' };

// PartsTech's callback format is undocumented: accept form posts and plain text as well as JSON.
router.use(express.urlencoded({ extended: true }), express.text({ type: ['text/*', 'application/xml'] }));

/** Public origin for PartsTech's callbacks (optional), and the origin the advisor's browser reached us on. */
const bases = req => ({ publicBaseUrl: process.env.PARTSTECH_CALLBACK_BASE_URL || null, browserBaseUrl: `${req.protocol}://${req.get('host')}` });

function sendError(res, err, where) {
  if (err instanceof PunchoutError) return res.status(err.status).json({ error: err.code, message: err.message });
  if (err instanceof PartsTechError) {
    const status = err.code === 'not_configured' ? 503 : err.code === 'fitment_not_found' ? 404 : 502;
    return res.status(status).json({ error: err.code, message: err.message });
  }
  console.error(`[partstech] ${where}:`, err);
  res.status(500).json({ error: 'internal', message: 'PartsTech request failed.' });
}

/** GET /api/partstech/suppliers -> the suppliers on the shop's PartsTech account, in its priority order (no credentials). */
router.get('/suppliers', async (_req, res) => {
  try { res.json(await shopSuppliers()); } catch (err) { sendError(res, err, 'suppliers'); }
});

/** GET /api/partstech/config -> how WrenchIQ connects to PartsTech (no secrets). */
router.get('/config', (_req, res) => {
  res.json(partstechConfig());
});

router.post('/sessions', async (req, res) => {
  try {
    const { vin, year, make, model, part, parts, partTypeIds, supplierOrder, roId } = req.body || {};
    res.status(201).json(await startSession(req.db, { vin, year, make, model, part, parts, partTypeIds, supplierOrder, roId }, bases(req)));
  } catch (err) { sendError(res, err, 'start session'); }
});

router.get('/sessions/:ref', async (req, res) => {
  try {
    res.json(await getSession(req.db, req.params.ref, { refresh: req.query.refresh === '1' }));
  } catch (err) { sendError(res, err, 'get session'); }
});

router.all('/callback/:ref/order', async (req, res) => {
  try {
    const s = await handleCallback(req.db, req.params.ref, 'order', req);
    console.log(`[partstech] order callback ${req.params.ref} (${req.method}, ${s.status}): ${s.parts.length} part(s)`);
    res.json(ACK);
  } catch (err) { sendError(res, err, 'order callback'); }
});

router.all('/callback/:ref', async (req, res) => {
  try {
    const s = await handleCallback(req.db, req.params.ref, 'cart', req);
    console.log(`[partstech] cart callback ${req.params.ref} (${req.method}, ${s.status}): ${s.parts.length} part(s)`);
    res.json(ACK);
  } catch (err) { sendError(res, err, 'cart callback'); }
});

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * The advisor's browser lands here from PartsTech. Re-read the cart, tell the WrenchIQ window that
 * opened PartsTech (postMessage to window.opener / parent frame), and close if this was a popup.
 */
router.get('/return/:ref', async (req, res) => {
  let s, error;
  try { s = await markReturned(req.db, req.params.ref); } catch (err) { error = err.message; }
  const rows = (s?.parts || []).map(p =>
    `<tr><td>${esc(p.brand)} ${esc(p.partNumber)}</td><td>${esc(p.description)}${p.position ? ' (' + esc(p.position) + ')' : ''}</td><td>${esc(p.quantity)}</td><td>${p.cost != null ? '$' + p.cost.toFixed(2) : '—'}</td><td>${esc(p.supplier)}</td></tr>`).join('');
  const message = JSON.stringify({ type: 'partstech:parts', ref: req.params.ref, count: s?.parts.length || 0, error: error || null });
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Parts sent to WrenchIQ</title>
<style>body{font:14px system-ui;margin:24px;color:#0D3B45}table{border-collapse:collapse;margin-top:12px}td{padding:4px 10px;border-bottom:1px solid #ddd}</style></head><body>
<h2>${error ? 'Could not read the PartsTech cart' : `${s.parts.length} part(s) sent to WrenchIQ`}</h2>
${error ? `<p>${esc(error)}</p>` : `<table>${rows}</table><p>Back to WrenchIQ: the parts are on the repair order's PartsTech card.</p>`}
<script>
  var msg = ${message.replace(/</g, '\\u003c')};
  var target = window.opener || (window.parent !== window ? window.parent : null);
  if (target) { target.postMessage(msg, '*'); if (window.opener && !msg.error) setTimeout(function () { window.close(); }, 1500); }
</script></body></html>`);
});

export default router;
