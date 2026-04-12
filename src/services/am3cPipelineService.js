/**
 * am3cPipelineService.js
 * Progressive Narrative Building — 7-Stage RO Pipeline
 * Jira AE-867
 *
 * Pure functions on plain objects. No external dependencies.
 */

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

export const STAGES = [
  { id: 'customer_intake',  label: 'Customer Intake',  order: 1, required: true  },
  { id: 'mpi_dvi',          label: 'MPI/DVI',          order: 2, required: false },
  { id: 'tsb_match',        label: 'TSB Match',        order: 3, required: false },
  { id: 'diagnostic_scan',  label: 'Diagnostic Scan',  order: 4, required: false },
  { id: 'tech_notes',       label: 'Tech Notes',       order: 5, required: true  },
  { id: 'work_performed',   label: 'Work Performed',   order: 6, required: true  },
  { id: 'final_review',     label: 'Final Review',     order: 7, required: true  },
];

// Internal lookup by id
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

// Ordered list of stage ids
const STAGE_IDS = STAGES.map(s => s.id);

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * createROContext
 * Returns a fresh ROContext for the given RO and VIN.
 *
 * @param {string} roId
 * @param {string} vehicleVin
 * @returns {object} ROContext
 */
export function createROContext(roId, vehicleVin) {
  const now = new Date().toISOString();
  return {
    roId,
    vin: vehicleVin,
    currentStage: 'customer_intake',
    stageHistory: [],       // [{ stageId, completedAt, skipped, reason, data }]
    vehicle: null,
    intake: null,           // customer complaint data
    dviFindings: [],
    tsbMatches: [],
    dtcCodes: [],
    techNotes: [],          // raw note strings
    classifiedNotes: [],
    partsInstalled: [],
    laborOps: [],
    assembledDocument: null,
    prediiScore: null,
    references: [],
    audit: { rawInput: [], edits: [] },
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _nextStageId(currentStageId) {
  const idx = STAGE_IDS.indexOf(currentStageId);
  if (idx === -1 || idx === STAGE_IDS.length - 1) return null;
  return STAGE_IDS[idx + 1];
}

function _hasHistoryEntry(roContext, stageId, skipped = false) {
  return roContext.stageHistory.some(
    entry => entry.stageId === stageId && entry.skipped === skipped
  );
}

/**
 * Merge stageData fields that are arrays into the context (append, no dupes).
 * Scalar fields are set directly.
 */
function _mergeStageData(roContext, stageData) {
  if (!stageData || typeof stageData !== 'object') return roContext;

  const arrayFields = [
    'dviFindings', 'tsbMatches', 'dtcCodes',
    'techNotes', 'classifiedNotes', 'partsInstalled',
    'laborOps', 'references',
  ];

  const scalarFields = [
    'vehicle', 'intake', 'assembledDocument', 'prediiScore',
  ];

  const updated = { ...roContext };

  for (const field of arrayFields) {
    if (stageData[field] !== undefined) {
      const incoming = Array.isArray(stageData[field]) ? stageData[field] : [stageData[field]];
      updated[field] = [...(roContext[field] || []), ...incoming];
    }
  }

  for (const field of scalarFields) {
    if (stageData[field] !== undefined) {
      updated[field] = stageData[field];
    }
  }

  // Merge audit entries if provided
  if (stageData.audit) {
    const auditRaw = Array.isArray(stageData.audit.rawInput) ? stageData.audit.rawInput : [];
    const auditEdits = Array.isArray(stageData.audit.edits) ? stageData.audit.edits : [];
    updated.audit = {
      rawInput: [...(roContext.audit?.rawInput || []), ...auditRaw],
      edits:    [...(roContext.audit?.edits    || []), ...auditEdits],
    };
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Core pipeline functions
// ---------------------------------------------------------------------------

/**
 * advanceStage
 * Records the completion of stageId, merges stageData, and advances currentStage.
 * Idempotent: re-submitting the same stage does not duplicate history entries.
 *
 * @param {object} roContext
 * @param {string} stageId       — stage being completed
 * @param {object} [stageData]   — data to merge into context
 * @returns {object} updated roContext (new object, does not mutate)
 */
export function advanceStage(roContext, stageId, stageData = {}) {
  if (!STAGE_MAP[stageId]) {
    throw new Error(`advanceStage: unknown stageId "${stageId}"`);
  }

  // Idempotency — if already recorded as completed, only re-merge data
  const alreadyCompleted = _hasHistoryEntry(roContext, stageId, false);

  let updated = { ...roContext };

  if (!alreadyCompleted) {
    const historyEntry = {
      stageId,
      completedAt: new Date().toISOString(),
      skipped: false,
      reason: null,
      data: stageData,
    };
    updated.stageHistory = [...roContext.stageHistory, historyEntry];
  }

  // Merge data regardless (idempotent on scalar fields; arrays may grow)
  updated = _mergeStageData(updated, stageData);

  // Advance currentStage only if this stage is the current one
  if (roContext.currentStage === stageId) {
    const next = _nextStageId(stageId);
    updated.currentStage = next !== null ? next : stageId;
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * skipStage
 * Marks a stage as skipped with an optional reason.
 * Only optional stages may be skipped; required stages will throw.
 *
 * @param {object} roContext
 * @param {string} stageId
 * @param {string} [reason]
 * @returns {object} updated roContext
 */
export function skipStage(roContext, stageId, reason = '') {
  const stage = STAGE_MAP[stageId];
  if (!stage) {
    throw new Error(`skipStage: unknown stageId "${stageId}"`);
  }
  if (stage.required) {
    throw new Error(`skipStage: stage "${stageId}" is required and cannot be skipped`);
  }

  // Idempotent
  if (_hasHistoryEntry(roContext, stageId, true)) {
    return roContext;
  }

  const historyEntry = {
    stageId,
    completedAt: new Date().toISOString(),
    skipped: true,
    reason: reason || null,
    data: null,
  };

  const updated = {
    ...roContext,
    stageHistory: [...roContext.stageHistory, historyEntry],
    updatedAt: new Date().toISOString(),
  };

  // Advance past skipped stage if it is the current one
  if (roContext.currentStage === stageId) {
    const next = _nextStageId(stageId);
    updated.currentStage = next !== null ? next : stageId;
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * getStageProgress
 * Returns a summary of pipeline progress.
 *
 * @param {object} roContext
 * @returns {{ completed: number, total: number, percentage: number, stages: Array }}
 */
export function getStageProgress(roContext) {
  const completedIds = new Set(
    roContext.stageHistory.map(e => e.stageId)
  );

  const stages = STAGES.map(stage => {
    let status;
    if (completedIds.has(stage.id)) {
      const entry = roContext.stageHistory.find(e => e.stageId === stage.id);
      status = entry && entry.skipped ? 'skipped' : 'completed';
    } else if (roContext.currentStage === stage.id) {
      status = 'current';
    } else {
      status = 'pending';
    }
    return { id: stage.id, label: stage.label, status };
  });

  const completed = stages.filter(s => s.status === 'completed' || s.status === 'skipped').length;
  const total = STAGES.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage, stages };
}

/**
 * getCurrentStage
 * Returns the stage object for the current stage.
 *
 * @param {object} roContext
 * @returns {object|null} stage object or null if not found
 */
export function getCurrentStage(roContext) {
  return STAGE_MAP[roContext.currentStage] || null;
}

/**
 * isStageCompleted
 * Returns true if the stage has a non-skipped history entry.
 *
 * @param {object} roContext
 * @param {string} stageId
 * @returns {boolean}
 */
export function isStageCompleted(roContext, stageId) {
  return roContext.stageHistory.some(
    entry => entry.stageId === stageId && !entry.skipped
  );
}

/**
 * canFinalizeDocument
 * Returns true when the minimum required stages for document generation
 * are complete: customer_intake and work_performed.
 *
 * @param {object} roContext
 * @returns {boolean}
 */
export function canFinalizeDocument(roContext) {
  return (
    isStageCompleted(roContext, 'customer_intake') &&
    isStageCompleted(roContext, 'work_performed')
  );
}
