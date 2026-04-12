/**
 * WrenchIQ — Recommendation MongoDB Schema
 *
 * Stores cached AI-generated recommendations per shop/edition.
 * TTL is enforced by the route handler checking ttlExpiresAt;
 * the TTL index on ttlExpiresAt provides automatic cleanup via MongoDB.
 */

// MongoDB native driver — no Mongoose needed (server uses mongodb directly).
// This module exports helper functions to read/write the recommendations collection.

export const COLL = 'recommendations';

/**
 * Ensure indexes on the recommendations collection.
 * Called once at server startup.
 */
export async function ensureRecommendationIndexes(db) {
  try {
    const col = db.collection(COLL);
    await Promise.all([
      col.createIndex({ shopId: 1 }),
      col.createIndex({ ttlExpiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  } catch (err) {
    console.warn('Recommendation index warning:', err.message);
  }
}

/**
 * Recommendation document shape (for reference):
 * {
 *   shopId:        String,       // indexed
 *   edition:       String,       // 'am' | 'oem'
 *   generatedAt:   Date,
 *   ttlExpiresAt:  Date,         // TTL index — auto-deleted by MongoDB after expiry
 *   recommendations: [
 *     {
 *       id:            String,
 *       domain:        String,   // 'utilization' | 'revenue' | 'customer_risk' | 'anomaly'
 *       priority:      String,   // 'high' | 'medium' | 'low'
 *       screenContext: [String],
 *       roNumber:      String,   // optional — RO that triggered this recommendation
 *       personas: {
 *         owner:   { headline: String, explanation: String, metrics: Object },
 *         advisor: { headline: String, explanation: String, metrics: Object },
 *         tech:    { headline: String, explanation: String, metrics: Object },
 *       },
 *       signal: Object,
 *     }
 *   ]
 * }
 */
