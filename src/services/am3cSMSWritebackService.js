/**
 * AM 3C SMS Write-back Service
 * Jira AE-880
 *
 * Syncs completed 3C documents back to the shop's Shop Management System (SMS).
 * Supports: Tekmetric, Shop-Ware, Shopmonkey, AutoLeap
 */

// ---------------------------------------------------------------------------
// 1. SMS Targets
// ---------------------------------------------------------------------------

export const SMS_TARGETS = {
  TEKMETRIC: {
    id: 'tekmetric',
    name: 'Tekmetric',
    writeEndpoint: '/api/v1/repair-orders/{id}',
    writeField: 'internal_notes',
  },
  SHOPWARE: {
    id: 'shop_ware',
    name: 'Shop-Ware',
    writeEndpoint: '/api/v1/repair_orders/{id}',
    writeField: 'notes',
  },
  SHOPMONKEY: {
    id: 'shopmonkey',
    name: 'Shopmonkey',
    writeEndpoint: '/api/v2/work-orders/{id}',
    writeField: 'internal_note',
  },
  AUTOLEAP: {
    id: 'autoleap',
    name: 'AutoLeap',
    writeEndpoint: '/api/v1/repair-orders/{id}/notes',
    writeField: 'note_text',
  },
};

// ---------------------------------------------------------------------------
// 2. Writeback Statuses
// ---------------------------------------------------------------------------

export const WRITEBACK_STATUSES = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  RETRYING: 'retrying',
};

// ---------------------------------------------------------------------------
// 3. createWritebackRecord
// ---------------------------------------------------------------------------

/**
 * Creates a new writeback record for a given 3C document, SMS target, and RO.
 *
 * @param {Object} document - The completed 3C document
 * @param {Object} smsTarget - One of the SMS_TARGETS values
 * @param {string} roId - Repair order ID in the target SMS
 * @returns {Object} Writeback record
 */
export function createWritebackRecord(document, smsTarget, roId) {
  const now = new Date().toISOString();
  return {
    id: `wb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    documentId: document.id,
    smsTarget: smsTarget.id,
    roId,
    status: WRITEBACK_STATUSES.PENDING,
    attempts: 0,
    lastAttemptAt: null,
    syncedAt: null,
    error: null,
    createdAt: now,
  };
}

// ---------------------------------------------------------------------------
// 4. formatPayload
// ---------------------------------------------------------------------------

/**
 * Formats the 3C document as a string suitable for the target SMS internal
 * notes field.
 *
 * @param {Object} document - The completed 3C document
 * @param {Object} smsTarget - One of the SMS_TARGETS values
 * @returns {string} Formatted notes string
 */
export function formatPayload(document, smsTarget) {
  const divider = '─'.repeat(60);
  const ts = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const concern = document.concern || '';
  const cause = document.cause || '';
  const correction = document.correction || '';
  const narrative = document.narrativeText || [concern, cause, correction].filter(Boolean).join('\n\n');
  const prediScore = document.prediScore !== undefined ? document.prediScore : 'N/A';
  const version = document.version || '1.0';
  const roId = document.roId || document.id || '';
  const customerLink = `https://app.wrenchiq.ai/customer-report/${roId}`;

  const lines = [
    `[WrenchIQ 3C Story — ${ts}]`,
    divider,
    narrative,
    divider,
    `Predii Score: ${prediScore}`,
    `Document Version: ${version}`,
    `Customer Report: ${customerLink}`,
    divider,
    `Synced via WrenchIQ to ${smsTarget.name}`,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 5. writebackToSMS
// ---------------------------------------------------------------------------

/**
 * Writes the 3C document back to the target SMS.
 *
 * Non-blocking: never throws, always returns the (possibly updated) record.
 *
 * @param {Object} record - Writeback record (from createWritebackRecord)
 * @param {Object} document - The completed 3C document
 * @param {Object} apiCredentials - API credentials for the SMS ({ apiKey, baseUrl, ... })
 * @param {boolean} [demoMode=true] - If true, simulates the API call
 * @returns {Promise<Object>} Updated writeback record
 */
export async function writebackToSMS(record, document, apiCredentials, demoMode = true) {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    attempts: record.attempts + 1,
    lastAttemptAt: now,
    status: WRITEBACK_STATUSES.RETRYING,
  };

  try {
    const target = Object.values(SMS_TARGETS).find((t) => t.id === record.smsTarget);
    if (!target) {
      throw new Error(`Unknown SMS target: ${record.smsTarget}`);
    }

    const payload = formatPayload(document, target);
    const endpoint = target.writeEndpoint.replace('{id}', record.roId);
    const body = { [target.writeField]: payload };

    if (demoMode) {
      // Simulate network latency: 500–800 ms
      const delay = 500 + Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return {
        ...updatedRecord,
        status: WRITEBACK_STATUSES.SYNCED,
        syncedAt: new Date().toISOString(),
        error: null,
      };
    }

    // Live mode — real API call (stubbed; replace fetch with actual HTTP client)
    const baseUrl = (apiCredentials && apiCredentials.baseUrl) || '';
    const apiKey = (apiCredentials && apiCredentials.apiKey) || '';
    console.log(`[am3cSMSWritebackService] LIVE write to ${target.name}`, {
      url: `${baseUrl}${endpoint}`,
      field: target.writeField,
      payloadLength: payload.length,
    });

    // Stub: in production this would be a real fetch/axios call
    // const response = await fetch(`${baseUrl}${endpoint}`, {
    //   method: 'PATCH',
    //   headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body),
    // });
    // if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    return {
      ...updatedRecord,
      status: WRITEBACK_STATUSES.SYNCED,
      syncedAt: new Date().toISOString(),
      error: null,
    };
  } catch (err) {
    return {
      ...updatedRecord,
      status: WRITEBACK_STATUSES.FAILED,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// 6. retryWriteback
// ---------------------------------------------------------------------------

/**
 * Retries a failed writeback up to maxAttempts total attempts.
 *
 * @param {Object} record - Writeback record
 * @param {Object} document - The completed 3C document
 * @param {Object} apiCredentials - API credentials for the SMS
 * @param {number} [maxAttempts=3] - Maximum total attempts (including prior ones)
 * @returns {Promise<Object>} Updated writeback record
 */
export async function retryWriteback(record, document, apiCredentials, maxAttempts = 3) {
  if (record.attempts >= maxAttempts) {
    return {
      ...record,
      status: WRITEBACK_STATUSES.FAILED,
      error: `Max retry attempts (${maxAttempts}) reached.`,
    };
  }

  const retryingRecord = {
    ...record,
    status: WRITEBACK_STATUSES.RETRYING,
  };

  return writebackToSMS(retryingRecord, document, apiCredentials);
}

// ---------------------------------------------------------------------------
// 7. writeCustomerResponse
// ---------------------------------------------------------------------------

/**
 * Writes a customer approval or decline decision back to the RO as a note.
 *
 * @param {string} roId - Repair order ID
 * @param {string} recommendationId - Recommendation or line-item ID
 * @param {Object} response - { itemId, decision: 'approved'|'declined', customerName, timestamp }
 * @param {Object} smsTarget - One of the SMS_TARGETS values
 * @param {Object} apiCredentials - API credentials for the SMS
 * @param {boolean} [demoMode=true] - If true, simulates the API call
 * @returns {Promise<Object>} Result object: { success, note, error }
 */
export async function writeCustomerResponse(
  roId,
  recommendationId,
  response,
  smsTarget,
  apiCredentials,
  demoMode = true
) {
  const { itemId, decision, customerName, timestamp } = response;
  const ts = timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  const decisionLabel = decision === 'approved' ? 'APPROVED' : 'DECLINED';
  const note = [
    `[WrenchIQ Customer Response — ${ts}]`,
    `Customer: ${customerName || 'Unknown'}`,
    `Recommendation ID: ${recommendationId || itemId || 'N/A'}`,
    `Item: ${itemId || 'N/A'}`,
    `Decision: ${decisionLabel}`,
    `Recorded via WrenchIQ customer portal`,
  ].join('\n');

  try {
    if (demoMode) {
      const delay = 400 + Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return { success: true, note, error: null };
    }

    // Live mode stub
    const endpoint = smsTarget.writeEndpoint.replace('{id}', roId);
    const baseUrl = (apiCredentials && apiCredentials.baseUrl) || '';
    const apiKey = (apiCredentials && apiCredentials.apiKey) || '';
    console.log(`[am3cSMSWritebackService] LIVE customer response write to ${smsTarget.name}`, {
      url: `${baseUrl}${endpoint}`,
      field: smsTarget.writeField,
      decision,
    });

    return { success: true, note, error: null };
  } catch (err) {
    return {
      success: false,
      note,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// 8. getWritebackStatus
// ---------------------------------------------------------------------------

const STATUS_META = {
  [WRITEBACK_STATUSES.PENDING]: { label: 'Pending', color: '#94a3b8' },
  [WRITEBACK_STATUSES.SYNCED]: { label: 'Synced', color: '#22c55e' },
  [WRITEBACK_STATUSES.FAILED]: { label: 'Failed', color: '#ef4444' },
  [WRITEBACK_STATUSES.RETRYING]: { label: 'Retrying', color: '#f59e0b' },
};

/**
 * Returns a human-readable status descriptor for a writeback record.
 *
 * @param {Object} record - Writeback record
 * @returns {{ status: string, label: string, color: string }}
 */
export function getWritebackStatus(record) {
  const status = record.status || WRITEBACK_STATUSES.PENDING;
  const meta = STATUS_META[status] || { label: 'Unknown', color: '#64748b' };
  return { status, label: meta.label, color: meta.color };
}
