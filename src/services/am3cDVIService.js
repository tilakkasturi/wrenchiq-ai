/**
 * am3cDVIService.js
 * DVI/MPI Integration Service — AE-877
 *
 * Ingests digital vehicle inspection findings into the 3C pipeline.
 * Handles status-based routing (green/yellow/red) and formats findings
 * for the Cause and Recommendations sections of the 3C Story Writer.
 *
 * No external dependencies. Pure functions on plain objects.
 */

import { DEMO_REGISTRY } from '../data/am3cDemoRegistry.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical DVI status values.
 * @type {{ GREEN: string, YELLOW: string, RED: string }}
 */
export const DVI_STATUSES = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

/**
 * Describes how each DVI status routes into the 3C pipeline.
 *
 * green    → excluded from the narrative entirely
 * yellow   → routed to Recommendations (advisory / monitor)
 * red      → actioned findings route to Cause;
 *            deferred or declined findings route to Recommendations
 */
export const DVI_ROUTING = {
  [DVI_STATUSES.GREEN]: {
    section: null,
    excluded: true,
    description: 'Passed — no action required. Excluded from 3C narrative.',
  },
  [DVI_STATUSES.YELLOW]: {
    section: 'recommendations',
    excluded: false,
    description: 'Advisory — routed to Recommendations section.',
  },
  [DVI_STATUSES.RED]: {
    actioned: {
      section: 'cause',
      excluded: false,
      description: 'Critical and actioned — routed to Cause section.',
    },
    deferred: {
      section: 'recommendations',
      excluded: false,
      description: 'Critical but deferred/declined — routed to Recommendations section.',
    },
  },
};

// ---------------------------------------------------------------------------
// Core ingestion
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} DVIFinding
 * @property {string}  id
 * @property {string}  item
 * @property {'green'|'yellow'|'red'} status
 * @property {string}  techNote
 * @property {boolean} [actioned]   - true if customer approved the repair
 * @property {string}  [measurement]
 * @property {string}  [oemSpec]
 * @property {string}  [photoRef]
 */

/**
 * @typedef {DVIFinding & { routed_to: 'cause'|'recommendations' }} EnrichedFinding
 */

/**
 * ingestDVIFindings
 *
 * Processes raw DVI findings, filters out green items, and attaches a
 * `routed_to` field indicating which 3C section the finding belongs to.
 *
 * Routing rules:
 *   green   → excluded (not returned)
 *   yellow  → routed_to: 'recommendations'
 *   red + actioned === true  → routed_to: 'cause'
 *   red + actioned !== true  → routed_to: 'recommendations'
 *
 * @param {DVIFinding[]} findings
 * @param {boolean} [demoMode=false]  - reserved for future demo-mode behaviour
 * @returns {EnrichedFinding[]}
 */
export function ingestDVIFindings(findings, demoMode = false) {
  if (!Array.isArray(findings)) return [];

  const enriched = [];

  for (const finding of findings) {
    if (!finding || typeof finding !== 'object') continue;

    const status = (finding.status || '').toLowerCase();

    // Green — excluded from the 3C narrative
    if (status === DVI_STATUSES.GREEN) continue;

    let routed_to;

    if (status === DVI_STATUSES.YELLOW) {
      routed_to = 'recommendations';
    } else if (status === DVI_STATUSES.RED) {
      routed_to = finding.actioned === true ? 'cause' : 'recommendations';
    } else {
      // Unknown status — treat conservatively as recommendation
      routed_to = 'recommendations';
    }

    enriched.push({ ...finding, routed_to });
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/**
 * formatDVIForCause
 *
 * Formats red/actioned findings for the Cause section of the 3C narrative.
 * Only includes findings that have been routed to 'cause'.
 *
 * Example output item:
 *   "Catalytic converter [DVI-1]: efficiency below OEM threshold
 *    (0.48 vs 0.65 spec). Confirmed by DVI inspection."
 *
 * @param {EnrichedFinding[]} findings  - already-enriched findings from ingestDVIFindings
 * @returns {string[]}
 */
export function formatDVIForCause(findings) {
  if (!Array.isArray(findings)) return [];

  return findings
    .filter((f) => f && f.routed_to === 'cause')
    .map((f) => {
      const label = f.item || 'Unknown item';
      const id = f.id ? `[${f.id}]` : '';
      const note = f.techNote ? f.techNote.replace(/\.?\s*$/, '') : 'See DVI findings';

      let measurementClause = '';
      if (f.measurement && f.oemSpec) {
        measurementClause = ` (${f.measurement} vs ${f.oemSpec} spec)`;
      } else if (f.measurement) {
        measurementClause = ` (${f.measurement})`;
      } else if (f.oemSpec) {
        measurementClause = ` (OEM spec: ${f.oemSpec})`;
      }

      return `${label}${id ? ' ' + id : ''}: ${note}${measurementClause}. Confirmed by DVI inspection.`;
    });
}

/**
 * formatDVIForRecommendations
 *
 * Formats yellow and deferred/declined red findings for the Recommendations
 * section of the 3C narrative.
 * Only includes findings that have been routed to 'recommendations'.
 *
 * Example output item:
 *   "Engine Air Filter [dvi-2401-01]: Filter is dirty and near end of
 *    service life. Recommend replacement. (Visual — heavy dust accumulation;
 *    OEM: Replace every 30,000 miles)"
 *
 * @param {EnrichedFinding[]} findings  - already-enriched findings from ingestDVIFindings
 * @returns {string[]}
 */
export function formatDVIForRecommendations(findings) {
  if (!Array.isArray(findings)) return [];

  return findings
    .filter((f) => f && f.routed_to === 'recommendations')
    .map((f) => {
      const label = f.item || 'Unknown item';
      const id = f.id ? `[${f.id}]` : '';
      const note = f.techNote ? f.techNote.replace(/\.?\s*$/, '') : 'See DVI findings';

      const detailParts = [];
      if (f.measurement) detailParts.push(f.measurement);
      if (f.oemSpec) detailParts.push(`OEM: ${f.oemSpec}`);

      const detail = detailParts.length > 0 ? ` (${detailParts.join('; ')})` : '';

      return `${label}${id ? ' ' + id : ''}: ${note}.${detail}`;
    });
}

// ---------------------------------------------------------------------------
// Demo data provider
// ---------------------------------------------------------------------------

/**
 * getDemoFindings
 *
 * Returns pre-seeded DVI findings for a given demo VIN from DEMO_REGISTRY.
 * Returns an empty array when the VIN is not found or has no dviFindings.
 *
 * @param {string} vin
 * @returns {DVIFinding[]}
 */
export function getDemoFindings(vin) {
  if (!vin || typeof vin !== 'string') return [];
  return DEMO_REGISTRY[vin]?.dviFindings || [];
}

// ---------------------------------------------------------------------------
// Webhook parsers
// ---------------------------------------------------------------------------

/**
 * Tekmetric severity → DVI_STATUSES mapping
 * ok       → green
 * advisory → yellow
 * critical → red
 */
const TEKMETRIC_SEVERITY_MAP = {
  ok: DVI_STATUSES.GREEN,
  advisory: DVI_STATUSES.YELLOW,
  critical: DVI_STATUSES.RED,
};

/**
 * parseTekmetricDVI
 *
 * Parses a Tekmetric DVI webhook payload into the standard DVIFinding[] format.
 *
 * Expected webhook shape:
 * {
 *   inspection_items: [
 *     { name, severity: 'ok'|'advisory'|'critical', notes, measurement, spec }
 *   ]
 * }
 *
 * Missing or null fields are handled gracefully.
 *
 * @param {object} webhookPayload
 * @returns {DVIFinding[]}
 */
export function parseTekmetricDVI(webhookPayload) {
  if (!webhookPayload || typeof webhookPayload !== 'object') return [];

  const items = webhookPayload.inspection_items;
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const rawSeverity = (item.severity || '').toLowerCase().trim();
      const status = TEKMETRIC_SEVERITY_MAP[rawSeverity] || DVI_STATUSES.YELLOW;

      return {
        id: item.id ? String(item.id) : `tekmetric-${index + 1}`,
        item: item.name || 'Unknown inspection item',
        status,
        techNote: item.notes || '',
        ...(item.measurement != null && { measurement: String(item.measurement) }),
        ...(item.spec != null && { oemSpec: String(item.spec) }),
      };
    });
}

/**
 * Shop-Ware condition → DVI_STATUSES mapping
 * pass    → green
 * monitor → yellow
 * fail    → red
 */
const SHOPWARE_CONDITION_MAP = {
  pass: DVI_STATUSES.GREEN,
  monitor: DVI_STATUSES.YELLOW,
  fail: DVI_STATUSES.RED,
};

/**
 * parseShopWareMPI
 *
 * Parses a Shop-Ware MPI webhook payload into the standard DVIFinding[] format.
 *
 * Expected webhook shape:
 * {
 *   mpi_items: [
 *     { description, condition: 'pass'|'monitor'|'fail', technician_note, actual, standard }
 *   ]
 * }
 *
 * Missing or null fields are handled gracefully.
 *
 * @param {object} webhookPayload
 * @returns {DVIFinding[]}
 */
export function parseShopWareMPI(webhookPayload) {
  if (!webhookPayload || typeof webhookPayload !== 'object') return [];

  const items = webhookPayload.mpi_items;
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const rawCondition = (item.condition || '').toLowerCase().trim();
      const status = SHOPWARE_CONDITION_MAP[rawCondition] || DVI_STATUSES.YELLOW;

      return {
        id: item.id ? String(item.id) : `shopware-${index + 1}`,
        item: item.description || 'Unknown MPI item',
        status,
        techNote: item.technician_note || '',
        ...(item.actual != null && { measurement: String(item.actual) }),
        ...(item.standard != null && { oemSpec: String(item.standard) }),
      };
    });
}
