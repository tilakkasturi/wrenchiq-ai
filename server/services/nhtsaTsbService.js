/**
 * WrenchIQ — NHTSA TSB Service
 *
 * Free, public REST API — no key or auth required. Queries NHTSA's
 * "Products" hierarchy (Year → Make → Model → payload) for Manufacturer
 * Communications (Technical Service Bulletins), the same family used for
 * NHTSA's own recall/complaint/TSB search tools (issueType 't' = TSBs, vs.
 * 'r' recalls / 'c' complaints — see src/services/nhtsaService.js for the
 * sibling recalls/complaints client already in this codebase).
 *
 * NOTE: this sandbox has no outbound network access to NHTSA to verify the
 * exact path segments live against current docs — NHTSA_TSB_API_BASE in
 * config.js is overridable via env var if the real paths differ once tested
 * against the network. The response shape (Id/Component/ManufacturerNumber/
 * NhtsaNumber/Summary/DateCommunicationSent/DocumentList) and the static PDF
 * URL format are per NHTSA's documented Manufacturer Communications schema.
 *
 * Results are cached in Mongo (models/TSBCache.js) since TSB filings change
 * rarely and NHTSA asks integrators to avoid tight polling loops.
 *
 * A lookup skill, not an agent — no LLM involved at all. See
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md.
 */

import { NHTSA_TSB_API_BASE, NHTSA_TSB_STATIC_BASE, NHTSA_TSB_CACHE_TTL_HOURS } from '../config.js';
import { COLL as TSB_CACHE_COLL } from '../models/TSBCache.js';

// ── Raw NHTSA calls ───────────────────────────────────────────────────────────

// Step 1 — all makes that filed TSBs for a given model year.
export async function fetchMakesForYear(year) {
  const params = new URLSearchParams({ modelYear: String(year), issueType: 't' });
  const res = await fetch(`${NHTSA_TSB_API_BASE}/makes?${params}`);
  if (!res.ok) throw new Error(`NHTSA makes lookup failed: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r) => r.Make || r.make).filter(Boolean);
}

// Step 2 — all models filed under a make for a given model year.
export async function fetchModelsForYearMake(year, make) {
  const params = new URLSearchParams({ modelYear: String(year), make, issueType: 't' });
  const res = await fetch(`${NHTSA_TSB_API_BASE}/models?${params}`);
  if (!res.ok) throw new Error(`NHTSA models lookup failed: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r) => r.Model || r.model).filter(Boolean);
}

// Step 3 — the actual TSB payload for year/make/model.
async function fetchTSBPayload(year, make, model) {
  const params = new URLSearchParams({ modelYear: String(year), make, model, issueType: 't' });
  const res = await fetch(`${NHTSA_TSB_API_BASE}/manufacturerCommunications?${params}`);
  if (!res.ok) throw new Error(`NHTSA TSB payload lookup failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// A TSB's PDF isn't hosted inline — it's reconstructed from the DocumentId
// against NHTSA's static document server.
export function buildTSBDocumentUrl(year, documentId) {
  if (!documentId) return null;
  return `${NHTSA_TSB_STATIC_BASE}/${year}/${documentId}.pdf`;
}

function normalizeTSB(raw, year) {
  const documents = (raw.DocumentList || []).map((d) => ({
    documentId:   d.DocumentId,
    documentType: d.DocumentType,
    pdfUrl:       buildTSBDocumentUrl(year, d.DocumentId),
  }));
  return {
    id:                    raw.Id,
    nhtsaNumber:           raw.NhtsaNumber,
    manufacturerNumber:    raw.ManufacturerNumber,
    component:             raw.Component,
    summary:               raw.Summary,
    dateCommunicationSent: raw.DateCommunicationSent,
    documents,
  };
}

// ── Cache-first lookup (the function callers should use) ──────────────────────

/**
 * Returns active TSBs for a specific year/make/model, reading from the Mongo
 * cache first and falling back to a live NHTSA call on a cache miss/expiry.
 * Tolerates NHTSA being unreachable — returns [] rather than throwing, same
 * fail-open convention as every other data fetcher in roAdvisorService.js.
 */
export async function getTSBsForVehicle(year, make, model, db) {
  if (!year || !make || !model) return [];
  const key = { year: Number(year), make: make.toLowerCase().trim(), model: model.toLowerCase().trim() };

  if (db) {
    try {
      const cached = await db.collection(TSB_CACHE_COLL).findOne({ ...key, ttlExpiresAt: { $gt: new Date() } });
      if (cached) return cached.tsbs;
    } catch (err) {
      console.warn('[nhtsaTsbService] cache read error:', err.message);
    }
  }

  let tsbs = [];
  try {
    const raw = await fetchTSBPayload(key.year, make, model);
    tsbs = raw.map((r) => normalizeTSB(r, key.year));
  } catch (err) {
    console.warn('[nhtsaTsbService] NHTSA fetch error:', err.message);
    return [];
  }

  if (db) {
    try {
      const now = new Date();
      await db.collection(TSB_CACHE_COLL).replaceOne(
        key,
        { ...key, tsbs, fetchedAt: now, ttlExpiresAt: new Date(now.getTime() + NHTSA_TSB_CACHE_TTL_HOURS * 60 * 60 * 1000) },
        { upsert: true }
      );
    } catch (err) {
      console.warn('[nhtsaTsbService] cache write error:', err.message);
    }
  }

  return tsbs;
}
