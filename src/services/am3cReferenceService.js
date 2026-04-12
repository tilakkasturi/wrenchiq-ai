// ============================================================
// AM 3C Reference Service — AE-871
// Source Reference & Audit Trail System for 3C documents.
// Tracks inline citations from DVI, TSB, DTC, Tech Notes,
// Parts, Labor, and Intake Complaint sources.
// Pure functions — no external imports.
// ============================================================

// ============================================================
// Reference types
// ============================================================

export const REFERENCE_TYPES = {
  DVI:       'DVI',
  TSB:       'TSB',
  DTC:       'DTC',
  TECH_NOTE: 'TECH_NOTE',
  PART:      'PART',
  LABOR:     'LABOR',
  INTAKE:    'INTAKE',
};

// ============================================================
// Module-level counters — auto-increment per type
// ============================================================

const _counters = {
  [REFERENCE_TYPES.DVI]:       0,
  [REFERENCE_TYPES.TSB]:       0,
  [REFERENCE_TYPES.DTC]:       0,
  [REFERENCE_TYPES.TECH_NOTE]: 0,
  [REFERENCE_TYPES.PART]:      0,
  [REFERENCE_TYPES.LABOR]:     0,
  [REFERENCE_TYPES.INTAKE]:    0,
};

let _auditEntryCounter = 0;
let _editCounter       = 0;

// ============================================================
// Internal helpers
// ============================================================

/**
 * Returns the prefix string used in marker labels for a given type.
 */
function _markerPrefix(type) {
  const MAP = {
    [REFERENCE_TYPES.DVI]:       'DVI',
    [REFERENCE_TYPES.TSB]:       'TSB',
    [REFERENCE_TYPES.DTC]:       'DTC',
    [REFERENCE_TYPES.TECH_NOTE]: 'TECH',
    [REFERENCE_TYPES.PART]:      'PART',
    [REFERENCE_TYPES.LABOR]:     'LABOR',
    [REFERENCE_TYPES.INTAKE]:    'INTAKE',
  };
  return MAP[type] ?? type;
}

/**
 * Builds the markerLabel for a reference.
 * TSB uses the TSB number from metadata; DTC uses the code; others use counter.
 *
 * @param {string} type
 * @param {number} counter   - The already-incremented counter value for this ref
 * @param {object} metadata
 * @returns {string}
 */
function _buildMarkerLabel(type, counter, metadata) {
  const prefix = _markerPrefix(type);

  if (type === REFERENCE_TYPES.TSB && metadata?.tsbNumber) {
    return `${prefix}-${metadata.tsbNumber}`;
  }

  if (type === REFERENCE_TYPES.DTC && metadata?.code) {
    return `${prefix}-${metadata.code}`;
  }

  return `${prefix}-${counter}`;
}

// ============================================================
// 1. createReference
// ============================================================

/**
 * Creates a Reference object with an auto-incrementing ID and marker label.
 *
 * @param {'DVI'|'TSB'|'DTC'|'TECH_NOTE'|'PART'|'LABOR'|'INTAKE'} type
 * @param {string} sourceStage   - Pipeline stage that produced this reference
 * @param {string} rawText       - The raw source text being cited
 * @param {object} [metadata]    - Type-specific metadata (tsbNumber, code, etc.)
 * @returns {Reference}
 *
 * @typedef {object} Reference
 * @property {string} id
 * @property {string} type
 * @property {string} sourceStage
 * @property {string} rawText
 * @property {object} metadata
 * @property {string} timestamp
 * @property {string} markerLabel
 */
export function createReference(type, sourceStage, rawText, metadata = {}) {
  if (!Object.values(REFERENCE_TYPES).includes(type)) {
    throw new Error(
      `createReference: unknown type "${type}". Must be one of: ${Object.values(REFERENCE_TYPES).join(', ')}`
    );
  }

  _counters[type] += 1;
  const counter = _counters[type];
  const markerLabel = _buildMarkerLabel(type, counter, metadata);

  return {
    id:          `ref_${type}_${counter}`,
    type,
    sourceStage,
    rawText,
    metadata,
    timestamp:   new Date().toISOString(),
    markerLabel,
  };
}

// ============================================================
// 2. buildReferencesFromContext
// ============================================================

/**
 * Extracts all source references from a fully-populated ROContext.
 *
 * @param {object} roContext
 * @param {object[]} [roContext.dviFindings]
 * @param {object[]} [roContext.tsbMatches]
 * @param {object[]} [roContext.dtcCodes]
 * @param {object[]} [roContext.classifiedNotes]
 * @param {object[]} [roContext.partsInstalled]
 * @param {object[]} [roContext.laborOps]
 * @param {string}   [roContext.intakeComplaint]
 * @returns {Reference[]}
 */
export function buildReferencesFromContext(roContext) {
  const refs = [];

  // DVI findings
  if (Array.isArray(roContext.dviFindings)) {
    for (const finding of roContext.dviFindings) {
      refs.push(
        createReference(
          REFERENCE_TYPES.DVI,
          'dvi',
          finding.note ?? finding.description ?? JSON.stringify(finding),
          {
            item:     finding.item ?? finding.name ?? null,
            status:   finding.status ?? null,
            severity: finding.severity ?? null,
          }
        )
      );
    }
  }

  // TSB matches
  if (Array.isArray(roContext.tsbMatches)) {
    for (const tsb of roContext.tsbMatches) {
      refs.push(
        createReference(
          REFERENCE_TYPES.TSB,
          'tsb',
          tsb.title ?? tsb.description ?? JSON.stringify(tsb),
          {
            tsbNumber:   tsb.tsbNumber ?? tsb.id ?? null,
            issuer:      tsb.issuer ?? null,
            affectedSystems: tsb.affectedSystems ?? null,
          }
        )
      );
    }
  }

  // DTC codes
  if (Array.isArray(roContext.dtcCodes)) {
    for (const dtc of roContext.dtcCodes) {
      const code = typeof dtc === 'string' ? dtc : (dtc.code ?? dtc.id ?? null);
      refs.push(
        createReference(
          REFERENCE_TYPES.DTC,
          'dtc',
          typeof dtc === 'string' ? dtc : (dtc.description ?? JSON.stringify(dtc)),
          {
            code,
            description: dtc.description ?? null,
            status:      dtc.status ?? null,
          }
        )
      );
    }
  }

  // Tech notes — only classifiedNotes that originated from TECH_NOTE source
  if (Array.isArray(roContext.classifiedNotes)) {
    for (const note of roContext.classifiedNotes) {
      if (note.source === 'TECH_NOTE' || note.type === 'TECH_NOTE') {
        refs.push(
          createReference(
            REFERENCE_TYPES.TECH_NOTE,
            'classification',
            note.text ?? note.rawText ?? JSON.stringify(note),
            {
              section:    note.section ?? null,
              confidence: note.confidence ?? null,
              model:      note.model ?? null,
            }
          )
        );
      }
    }
  }

  // Parts installed
  if (Array.isArray(roContext.partsInstalled)) {
    for (const part of roContext.partsInstalled) {
      refs.push(
        createReference(
          REFERENCE_TYPES.PART,
          'parts',
          part.name ?? part.description ?? JSON.stringify(part),
          {
            partNumber: part.partNumber ?? part.number ?? null,
            vendor:     part.vendor ?? null,
            quantity:   part.quantity ?? null,
            unitCost:   part.unitCost ?? null,
          }
        )
      );
    }
  }

  // Labor operations
  if (Array.isArray(roContext.laborOps)) {
    for (const op of roContext.laborOps) {
      refs.push(
        createReference(
          REFERENCE_TYPES.LABOR,
          'labor',
          op.description ?? op.name ?? JSON.stringify(op),
          {
            opCode:   op.opCode ?? op.code ?? null,
            hours:    op.hours ?? null,
            techId:   op.techId ?? null,
          }
        )
      );
    }
  }

  // Intake complaint — single reference
  if (roContext.intakeComplaint) {
    refs.push(
      createReference(
        REFERENCE_TYPES.INTAKE,
        'intake',
        typeof roContext.intakeComplaint === 'string'
          ? roContext.intakeComplaint
          : JSON.stringify(roContext.intakeComplaint),
        {}
      )
    );
  }

  return refs;
}

// ============================================================
// 3. formatReferenceListEntry
// ============================================================

/**
 * Returns a numbered list entry string for display in the reference list panel.
 * Format: "[N] Type Label — Key: Value — ..."
 *
 * @param {Reference} ref
 * @param {number} [number]  - Explicit display number; defaults to counter suffix
 * @returns {string}
 */
export function formatReferenceListEntry(ref, number) {
  // Derive display number from the id suffix when not supplied
  const displayNum = number != null
    ? number
    : Number(ref.id.split('_').pop()) || 1;

  const parts = [`[${displayNum}]`];

  switch (ref.type) {
    case REFERENCE_TYPES.DVI: {
      parts.push('DVI Inspection');
      if (ref.metadata.item)   parts.push(`Item: ${ref.metadata.item}`);
      if (ref.metadata.status) parts.push(`Status: ${ref.metadata.status}`);
      if (ref.rawText)         parts.push(`Tech Note: "${ref.rawText}"`);
      break;
    }
    case REFERENCE_TYPES.TSB: {
      parts.push('Technical Service Bulletin');
      if (ref.metadata.tsbNumber) parts.push(`TSB#: ${ref.metadata.tsbNumber}`);
      if (ref.metadata.issuer)    parts.push(`Issuer: ${ref.metadata.issuer}`);
      if (ref.rawText)            parts.push(`Title: "${ref.rawText}"`);
      break;
    }
    case REFERENCE_TYPES.DTC: {
      parts.push('Diagnostic Trouble Code');
      if (ref.metadata.code)        parts.push(`Code: ${ref.metadata.code}`);
      if (ref.metadata.description) parts.push(`Description: ${ref.metadata.description}`);
      break;
    }
    case REFERENCE_TYPES.TECH_NOTE: {
      parts.push('Technician Note');
      if (ref.metadata.section) parts.push(`Section: ${ref.metadata.section}`);
      if (ref.rawText)          parts.push(`Note: "${ref.rawText}"`);
      break;
    }
    case REFERENCE_TYPES.PART: {
      parts.push('Part');
      if (ref.metadata.partNumber) parts.push(`Part#: ${ref.metadata.partNumber}`);
      if (ref.metadata.vendor)     parts.push(`Vendor: ${ref.metadata.vendor}`);
      if (ref.rawText)             parts.push(`Description: "${ref.rawText}"`);
      break;
    }
    case REFERENCE_TYPES.LABOR: {
      parts.push('Labor Operation');
      if (ref.metadata.opCode) parts.push(`Op Code: ${ref.metadata.opCode}`);
      if (ref.metadata.hours != null) parts.push(`Hours: ${ref.metadata.hours}`);
      if (ref.rawText)         parts.push(`Description: "${ref.rawText}"`);
      break;
    }
    case REFERENCE_TYPES.INTAKE: {
      parts.push('Intake Complaint');
      if (ref.rawText) parts.push(`Complaint: "${ref.rawText}"`);
      break;
    }
    default: {
      parts.push(ref.type);
      if (ref.rawText) parts.push(`"${ref.rawText}"`);
    }
  }

  return parts.join(' — ');
}

// ============================================================
// 4. injectMarkers
// ============================================================

/**
 * Injects inline reference markers into prose text.
 * For this demo: appends the marker of the first matching reference type
 * to the end of each sentence (period-terminated).
 *
 * @param {string} text
 * @param {Reference[]} references
 * @returns {string}
 */
export function injectMarkers(text, references) {
  if (!text || !references || references.length === 0) return text;

  // Build a quick lookup: type -> first reference with that type
  const byType = {};
  for (const ref of references) {
    if (!byType[ref.type]) {
      byType[ref.type] = ref;
    }
  }

  // Split on sentences (naively by '. ', '! ', '? ', or end-of-string)
  const sentencePattern = /([^.!?]+[.!?]+)\s*/g;
  let result = '';
  let lastIndex = 0;
  let sentenceIndex = 0;

  let match;
  while ((match = sentencePattern.exec(text)) !== null) {
    let sentence = match[1];

    // Pick a reference type to attach based on round-robin across present types
    const typeKeys = Object.keys(byType);
    if (typeKeys.length > 0) {
      const ref = byType[typeKeys[sentenceIndex % typeKeys.length]];
      // Remove trailing punctuation, append marker, restore punctuation
      const punctMatch = sentence.match(/([.!?]+)$/);
      if (punctMatch) {
        const punct = punctMatch[1];
        sentence = sentence.slice(0, sentence.length - punct.length) +
          ` [${ref.markerLabel}]` + punct;
      } else {
        sentence = sentence + ` [${ref.markerLabel}]`;
      }
    }

    result += sentence;
    if (match[0].length > match[1].length) {
      // Preserve whitespace between sentences
      result += ' ';
    }

    lastIndex = sentencePattern.lastIndex;
    sentenceIndex += 1;
  }

  // Append any trailing text that did not end with punctuation
  if (lastIndex < text.length) {
    result += text.slice(lastIndex);
  }

  return result.trimEnd();
}

// ============================================================
// 5. Audit Trail
// ============================================================

/**
 * Creates a single audit entry (immutable once created).
 *
 * @param {'input'|'edit'|'approval'|'export'|string} type
 * @param {string} stageId   - Pipeline stage or section identifier
 * @param {string} content   - The raw or processed content snapshot
 * @param {string} author    - User ID or role string (e.g. "tech:1" or "advisor")
 * @returns {AuditEntry}
 *
 * @typedef {object} AuditEntry
 * @property {string} id
 * @property {string} type
 * @property {string} stageId
 * @property {string} content
 * @property {string} author
 * @property {string} timestamp
 * @property {true}   immutable
 */
export function createAuditEntry(type, stageId, content, author) {
  _auditEntryCounter += 1;
  return {
    id:        `audit_${_auditEntryCounter}`,
    type,
    stageId,
    content,
    author,
    timestamp: new Date().toISOString(),
    immutable: true,
  };
}

/**
 * Returns a new audit object with the entry appended to rawInput.
 * rawInput entries are considered immutable once appended — a new array
 * is returned rather than mutating the original.
 *
 * @param {object} audit          - Existing audit object with a rawInput array
 * @param {AuditEntry} entry
 * @returns {object}              - New audit object
 */
export function appendToAudit(audit, entry) {
  return {
    ...audit,
    rawInput: [...(audit.rawInput ?? []), entry],
  };
}

/**
 * Records an edit to a document section and returns a new audit object.
 *
 * @param {object} audit
 * @param {string} sectionId
 * @param {string} originalText
 * @param {string} newText
 * @param {string} author
 * @returns {object}  - New audit object with edit appended
 */
export function recordEdit(audit, sectionId, originalText, newText, author) {
  _editCounter += 1;

  const edit = {
    id:           `edit_${_editCounter}`,
    sectionId,
    originalText,
    newText,
    author,
    timestamp:    new Date().toISOString(),
    characterDelta: newText.length - originalText.length,
    immutable:    true,
  };

  return {
    ...audit,
    edits: [...(audit.edits ?? []), edit],
  };
}

// ============================================================
// 6. Export functions
// ============================================================

/**
 * Exports the full audit trail of a document as a JSON string.
 *
 * @param {object} document   - Must have an `audit` property
 * @returns {string}          - Formatted JSON
 */
export function exportAuditJSON(document) {
  const audit = document?.audit ?? document ?? {};
  return JSON.stringify(audit, null, 2);
}

/**
 * Returns a human-readable plain text summary of the audit trail.
 *
 * @param {object} document   - Must have an `audit` property
 * @returns {string}
 */
export function exportAuditSummary(document) {
  const audit = document?.audit ?? document ?? {};
  const lines = [];

  lines.push('=== AUDIT TRAIL SUMMARY ===');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Raw inputs
  const rawInput = audit.rawInput ?? [];
  lines.push(`Raw Inputs (${rawInput.length})`);
  lines.push('-'.repeat(40));
  if (rawInput.length === 0) {
    lines.push('  (none)');
  } else {
    for (const entry of rawInput) {
      lines.push(`  [${entry.id}] ${entry.timestamp}`);
      lines.push(`    Stage:   ${entry.stageId}`);
      lines.push(`    Author:  ${entry.author}`);
      lines.push(`    Type:    ${entry.type}`);
      const preview = (entry.content ?? '').slice(0, 120).replace(/\n/g, ' ');
      lines.push(`    Content: ${preview}${entry.content && entry.content.length > 120 ? '...' : ''}`);
    }
  }

  lines.push('');

  // Edits
  const edits = audit.edits ?? [];
  lines.push(`Edits (${edits.length})`);
  lines.push('-'.repeat(40));
  if (edits.length === 0) {
    lines.push('  (none)');
  } else {
    for (const edit of edits) {
      const delta = edit.characterDelta >= 0
        ? `+${edit.characterDelta}`
        : `${edit.characterDelta}`;
      lines.push(`  [${edit.id}] ${edit.timestamp}`);
      lines.push(`    Section: ${edit.sectionId}`);
      lines.push(`    Author:  ${edit.author}`);
      lines.push(`    Delta:   ${delta} chars`);
      const origPreview = (edit.originalText ?? '').slice(0, 80).replace(/\n/g, ' ');
      const newPreview  = (edit.newText ?? '').slice(0, 80).replace(/\n/g, ' ');
      lines.push(`    Before:  "${origPreview}${edit.originalText && edit.originalText.length > 80 ? '...' : ''}"`);
      lines.push(`    After:   "${newPreview}${edit.newText && edit.newText.length > 80 ? '...' : ''}"`);
    }
  }

  lines.push('');
  lines.push('=== END AUDIT TRAIL ===');

  return lines.join('\n');
}
