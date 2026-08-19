/**
 * WrenchIQ — NHTSA TSB Cache
 *
 * Caches NHTSA Technical Service Bulletin (Manufacturer Communications)
 * lookups by (year, make, model) so the RO Advisor Agent's get_tsbs tool
 * doesn't hit NHTSA's public API on every RO — see NHTSA_TSB_CACHE_TTL_HOURS
 * in config.js. TTL is enforced the same way as recommendations.js: the read
 * checks ttlExpiresAt itself, backed by a Mongo TTL index for cleanup.
 */

export const COLL = 'nhtsa_tsb_cache';

export async function ensureTSBCacheIndexes(db) {
  try {
    const col = db.collection(COLL);
    await Promise.all([
      col.createIndex({ year: 1, make: 1, model: 1 }, { unique: true }),
      col.createIndex({ ttlExpiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  } catch (err) {
    console.warn('TSBCache index warning:', err.message);
  }
}

/**
 * TSB cache document shape (for reference):
 * {
 *   year:          Number,
 *   make:          String,       // lowercased for lookup consistency
 *   model:         String,       // lowercased for lookup consistency
 *   fetchedAt:     Date,
 *   ttlExpiresAt:  Date,         // TTL index — auto-deleted by MongoDB after expiry
 *   tsbs: [
 *     {
 *       id:                   String,  // NHTSA Id
 *       nhtsaNumber:          String,
 *       manufacturerNumber:   String,
 *       component:            String,
 *       summary:              String,
 *       dateCommunicationSent: String,
 *       documents: [ { documentId: String, documentType: String, pdfUrl: String } ],
 *     }
 *   ]
 * }
 */
