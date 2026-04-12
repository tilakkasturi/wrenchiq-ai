/**
 * am3cAssemblyService.js
 * Narrative Assembly Engine — Jira AE-869
 *
 * Assembles the final 3C document from all classified evidence
 * collected through the pipeline stages.
 *
 * Pure functions on plain objects. No imports from other am3c services.
 */

// ---------------------------------------------------------------------------
// Section source mapping
// ---------------------------------------------------------------------------

/**
 * Maps which roContext fields feed which section of the 3C document.
 */
export const SECTION_SOURCES = {
  complaint: ['intake', 'classifiedNotes.complaint'],
  cause: ['dviFindings.red', 'tsbMatches', 'dtcCodes', 'classifiedNotes.cause'],
  correction: ['partsInstalled', 'laborOps', 'classifiedNotes.correction'],
  recommendations: ['dviFindings.yellow', 'dviFindings.red_deferred', 'classifiedNotes.recommendation'],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns DVI findings filtered by severity level.
 * Red items with status 'deferred' are tracked separately from actioned red items.
 *
 * @param {Array} dviFindings
 * @param {'red'|'yellow'|'green'} severity
 * @param {boolean} [deferredOnly=false]
 * @returns {Array}
 */
function _filterDVI(dviFindings, severity, deferredOnly = false) {
  if (!Array.isArray(dviFindings)) return [];
  return dviFindings.filter((f) => {
    const matchSeverity =
      (f.severity || f.status || f.priority || '').toLowerCase() === severity;
    if (!matchSeverity) return false;
    if (deferredOnly) {
      return (f.action || '').toLowerCase() === 'deferred' ||
             (f.disposition || '').toLowerCase() === 'deferred';
    }
    if (severity === 'red') {
      // Actioned red items: not deferred (repaired/corrected)
      return (f.action || '').toLowerCase() !== 'deferred' &&
             (f.disposition || '').toLowerCase() !== 'deferred';
    }
    return true;
  });
}

/**
 * Returns classifiedNotes filtered to a specific section.
 *
 * @param {Array} classifiedNotes
 * @param {string} section
 * @returns {Array}
 */
function _filterNotes(classifiedNotes, section) {
  if (!Array.isArray(classifiedNotes)) return [];
  return classifiedNotes.filter((n) => n.section === section);
}

/**
 * Accepts TSB matches that were accepted/confirmed, not just surfaced.
 *
 * @param {Array} tsbMatches
 * @returns {Array}
 */
function _acceptedTSBs(tsbMatches) {
  if (!Array.isArray(tsbMatches)) return [];
  return tsbMatches.filter(
    (t) =>
      t.accepted === true ||
      (t.status || '').toLowerCase() === 'accepted' ||
      (t.status || '').toLowerCase() === 'applied'
  );
}

/**
 * Slugifies a reference tag prefix to safe uppercase letters.
 */
function _refTag(prefix, index) {
  return `[${prefix.toUpperCase()}-${index}]`;
}

/**
 * Superscript Unicode characters for reference numbers 1–9.
 * Falls back to regular digits wrapped in parentheses for higher numbers.
 */
const SUPERSCRIPTS = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

function _superscript(n) {
  if (n >= 1 && n <= 9) return SUPERSCRIPTS[n - 1];
  return `(${n})`;
}

// ---------------------------------------------------------------------------
// Narrative text generators
// ---------------------------------------------------------------------------

/**
 * Builds the Complaint narrative from intake data and classified complaint notes.
 *
 * @param {object|null} intake
 * @param {Array} complaintNotes     - ClassifiedNote[] with section='complaint'
 * @param {Array} references         - mutable reference registry (pushed into)
 * @returns {{ text: string, sentences: Array, sources: string[] }}
 */
function _buildComplaintSection(intake, complaintNotes, references) {
  const sentences = [];
  const sources = [];

  // --- Intake customer-stated complaint ---
  if (intake) {
    const intakeIdx = references.length + 1;
    const tag = _refTag('INTAKE', intakeIdx);
    references.push({
      index: intakeIdx,
      tag,
      type: 'intake',
      label: 'Customer Intake Statement',
      content: intake.complaint || intake.description || intake.customerConcern || '',
    });

    const concern = intake.complaint || intake.description || intake.customerConcern || 'concern as described';
    const mileage = intake.mileage ? ` at ${Number(intake.mileage).toLocaleString()} miles` : '';
    const text = `Customer states${mileage}: ${concern} ${tag}`;
    sentences.push({ text, source: 'intake', refTag: tag });
    sources.push('intake');

    if (intake.drivingConditions) {
      const condText = `Condition occurs: ${intake.drivingConditions} ${tag}`;
      sentences.push({ text: condText, source: 'intake', refTag: tag });
    }
  }

  // --- Classified complaint notes ---
  complaintNotes.forEach((note, i) => {
    const noteIdx = references.length + 1;
    const tag = _refTag('TECH', noteIdx);
    references.push({
      index: noteIdx,
      tag,
      type: 'tech_note',
      label: `Technician Note (Complaint) #${i + 1}`,
      content: note.text,
    });
    sentences.push({ text: `${note.text} ${tag}`, source: 'classifiedNotes.complaint', refTag: tag });
    if (!sources.includes('classifiedNotes.complaint')) sources.push('classifiedNotes.complaint');
  });

  const text = sentences.map((s) => s.text).join(' ').trim();
  return { text, sentences, sources };
}

/**
 * Builds the Cause narrative from DVI red findings, accepted TSBs, DTC codes,
 * and classified cause notes.
 *
 * @param {Array} redFindings
 * @param {Array} acceptedTSBs
 * @param {Array} dtcCodes
 * @param {Array} causeNotes
 * @param {Array} references
 * @returns {{ text: string, sentences: Array, sources: string[] }}
 */
function _buildCauseSection(redFindings, acceptedTSBs, dtcCodes, causeNotes, references) {
  const sentences = [];
  const sources = [];

  // --- DVI red items actioned (repaired) ---
  redFindings.forEach((finding, i) => {
    const idx = references.length + 1;
    const tag = _refTag('DVI', idx);
    const desc = finding.description || finding.item || finding.name || 'item';
    const detail = finding.detail || finding.note || '';
    references.push({
      index: idx,
      tag,
      type: 'dvi',
      label: `DVI Inspection Finding #${i + 1}`,
      content: detail ? `${desc} — ${detail}` : desc,
    });

    const condText = detail
      ? `Inspection confirmed ${desc.toLowerCase()}: ${detail} ${tag}`
      : `Inspection confirmed ${desc.toLowerCase()} ${tag}`;
    sentences.push({ text: condText, source: 'dviFindings.red', refTag: tag });
    if (!sources.includes('dviFindings.red')) sources.push('dviFindings.red');
  });

  // --- Accepted TSBs ---
  acceptedTSBs.forEach((tsb, i) => {
    const idx = references.length + 1;
    const tsbNumber = tsb.number || tsb.tsbNumber || tsb.id || `TSB-${i + 1}`;
    const tag = _refTag('TSB', idx);
    references.push({
      index: idx,
      tag,
      type: 'tsb',
      label: `Technical Service Bulletin ${tsbNumber}`,
      content: tsb.summary || tsb.description || tsb.title || '',
    });

    const summary = tsb.summary || tsb.description || tsb.title || 'known defect pattern';
    const text = `Root cause consistent with OEM Technical Service Bulletin ${tsbNumber}: ${summary} ${tag}`;
    sentences.push({ text, source: 'tsbMatches', refTag: tag });
    if (!sources.includes('tsbMatches')) sources.push('tsbMatches');
  });

  // --- DTC codes ---
  dtcCodes.forEach((dtc, i) => {
    const idx = references.length + 1;
    const code = dtc.code || dtc.dtc || (typeof dtc === 'string' ? dtc : `DTC-${i + 1}`);
    const tag = _refTag('DTC', idx);
    references.push({
      index: idx,
      tag,
      type: 'dtc',
      label: `Diagnostic Trouble Code ${code}`,
      content: dtc.description || dtc.desc || dtc.definition || '',
    });

    const desc = dtc.description || dtc.desc || dtc.definition || '';
    const text = desc
      ? `Scan tool retrieved ${code} — ${desc} ${tag}`
      : `Scan tool retrieved fault code ${code} ${tag}`;
    sentences.push({ text, source: 'dtcCodes', refTag: tag });
    if (!sources.includes('dtcCodes')) sources.push('dtcCodes');
  });

  // --- Classified cause notes ---
  causeNotes.forEach((note, i) => {
    const idx = references.length + 1;
    const tag = _refTag('TECH', idx);
    references.push({
      index: idx,
      tag,
      type: 'tech_note',
      label: `Technician Note (Cause) #${i + 1}`,
      content: note.text,
    });
    sentences.push({ text: `${note.text} ${tag}`, source: 'classifiedNotes.cause', refTag: tag });
    if (!sources.includes('classifiedNotes.cause')) sources.push('classifiedNotes.cause');
  });

  const text = sentences.map((s) => s.text).join(' ').trim();
  return { text, sentences, sources };
}

/**
 * Builds the Correction narrative from parts installed, labor ops,
 * and classified correction notes.
 *
 * @param {Array} partsInstalled
 * @param {Array} laborOps
 * @param {Array} correctionNotes
 * @param {Array} references
 * @returns {{ text: string, sentences: Array, sources: string[] }}
 */
function _buildCorrectionSection(partsInstalled, laborOps, correctionNotes, references) {
  const sentences = [];
  const sources = [];

  // --- Parts installed ---
  partsInstalled.forEach((part, i) => {
    const idx = references.length + 1;
    const tag = _refTag('PART', idx);
    const partNum = part.partNumber || part.partNum || part.number || '';
    const desc = part.description || part.name || part.part || 'part';
    const qty = part.quantity || part.qty || 1;
    const label = partNum ? `${desc} (P/N ${partNum})` : desc;
    references.push({
      index: idx,
      tag,
      type: 'part',
      label: `Part Installed #${i + 1}`,
      content: label,
    });

    const qtyText = qty > 1 ? `${qty}x ` : '';
    const text = `Installed ${qtyText}${label} ${tag}`;
    sentences.push({ text, source: 'partsInstalled', refTag: tag });
    if (!sources.includes('partsInstalled')) sources.push('partsInstalled');
  });

  // --- Labor operations ---
  laborOps.forEach((op, i) => {
    const idx = references.length + 1;
    const tag = _refTag('LABOR', idx);
    const desc = op.description || op.operation || op.name || 'labor operation';
    const opCode = op.opCode || op.laborCode || op.code || '';
    references.push({
      index: idx,
      tag,
      type: 'labor',
      label: `Labor Operation #${i + 1}`,
      content: opCode ? `${desc} (Op Code: ${opCode})` : desc,
    });

    const text = opCode
      ? `Performed ${desc} (Op Code: ${opCode}) ${tag}`
      : `Performed ${desc} ${tag}`;
    sentences.push({ text, source: 'laborOps', refTag: tag });
    if (!sources.includes('laborOps')) sources.push('laborOps');
  });

  // --- Classified correction notes ---
  correctionNotes.forEach((note, i) => {
    const idx = references.length + 1;
    const tag = _refTag('TECH', idx);
    references.push({
      index: idx,
      tag,
      type: 'tech_note',
      label: `Technician Note (Correction) #${i + 1}`,
      content: note.text,
    });
    sentences.push({ text: `${note.text} ${tag}`, source: 'classifiedNotes.correction', refTag: tag });
    if (!sources.includes('classifiedNotes.correction')) sources.push('classifiedNotes.correction');
  });

  const text = sentences.map((s) => s.text).join(' ').trim();
  return { text, sentences, sources };
}

/**
 * Builds the Recommendations narrative from deferred DVI yellow and red findings,
 * and classified recommendation notes.
 *
 * @param {Array} yellowFindings
 * @param {Array} redDeferredFindings
 * @param {Array} recommendationNotes
 * @param {Array} references
 * @returns {{ text: string, sentences: Array, sources: string[] }}
 */
function _buildRecommendationsSection(yellowFindings, redDeferredFindings, recommendationNotes, references) {
  const sentences = [];
  const sources = [];

  // --- Yellow DVI findings (monitor / advisory) ---
  yellowFindings.forEach((finding, i) => {
    const idx = references.length + 1;
    const tag = _refTag('DVI', idx);
    const desc = finding.description || finding.item || finding.name || 'item';
    const detail = finding.detail || finding.note || '';
    references.push({
      index: idx,
      tag,
      type: 'dvi',
      label: `DVI Advisory Finding #${i + 1}`,
      content: detail ? `${desc} — ${detail}` : desc,
    });

    const text = detail
      ? `Recommend monitoring ${desc.toLowerCase()}: ${detail} ${tag}`
      : `Recommend monitoring ${desc.toLowerCase()} at next service interval ${tag}`;
    sentences.push({ text, source: 'dviFindings.yellow', refTag: tag });
    if (!sources.includes('dviFindings.yellow')) sources.push('dviFindings.yellow');
  });

  // --- Red DVI findings that were deferred by customer ---
  redDeferredFindings.forEach((finding, i) => {
    const idx = references.length + 1;
    const tag = _refTag('DVI', idx);
    const desc = finding.description || finding.item || finding.name || 'item';
    const detail = finding.detail || finding.note || '';
    references.push({
      index: idx,
      tag,
      type: 'dvi',
      label: `DVI Deferred Safety Item #${i + 1}`,
      content: detail ? `${desc} — ${detail}` : desc,
    });

    const text = detail
      ? `Safety concern deferred at customer request — ${desc.toLowerCase()}: ${detail}. Strongly recommend repair at earliest opportunity ${tag}`
      : `Safety concern deferred at customer request — ${desc.toLowerCase()}. Strongly recommend repair at earliest opportunity ${tag}`;
    sentences.push({ text, source: 'dviFindings.red_deferred', refTag: tag });
    if (!sources.includes('dviFindings.red_deferred')) sources.push('dviFindings.red_deferred');
  });

  // --- Classified recommendation notes ---
  recommendationNotes.forEach((note, i) => {
    const idx = references.length + 1;
    const tag = _refTag('TECH', idx);
    references.push({
      index: idx,
      tag,
      type: 'tech_note',
      label: `Technician Note (Recommendation) #${i + 1}`,
      content: note.text,
    });
    sentences.push({ text: `${note.text} ${tag}`, source: 'classifiedNotes.recommendation', refTag: tag });
    if (!sources.includes('classifiedNotes.recommendation')) sources.push('classifiedNotes.recommendation');
  });

  const text = sentences.map((s) => s.text).join(' ').trim();
  return { text, sentences, sources };
}

// ---------------------------------------------------------------------------
// Plain language converter
// ---------------------------------------------------------------------------

/**
 * Converts a tech-facing sentence with a [REF-N] tag into plain language
 * suitable for the customer document.
 *
 * @param {string} techText
 * @returns {string}
 */
function _toPlainLanguage(techText) {
  return techText
    // Soften scan tool jargon
    .replace(/Scan tool retrieved fault code/gi, 'Our diagnostic equipment found a fault code')
    .replace(/Scan tool retrieved/gi, 'Our diagnostic equipment found')
    // TSB language
    .replace(/OEM Technical Service Bulletin/gi, 'manufacturer service bulletin')
    .replace(/Technical Service Bulletin/gi, 'manufacturer service bulletin')
    // Part number parenthetical — hide from customers
    .replace(/\s*\(P\/N\s+[A-Z0-9-]+\)/gi, '')
    // Labor op codes
    .replace(/\s*\(Op Code:\s*[A-Z0-9-]+\)/gi, '')
    // DTC codes — soften
    .replace(/\b([PBCU][0-9A-F]{4})\b/g, 'fault code $1')
    // "Installed X" → "We installed X"
    .replace(/^Installed /i, 'We installed ')
    // "Performed X" → "We performed X"
    .replace(/^Performed /i, 'We performed ')
    // "Inspection confirmed" → "Our inspection found"
    .replace(/^Inspection confirmed/i, 'Our inspection found')
    // "Root cause consistent with" → "The cause is"
    .replace(/^Root cause consistent with/i, 'The cause was identified as')
    // Trim extra whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Exported document builders
// ---------------------------------------------------------------------------

/**
 * Assembles the full technician document text with inline [REF] markers.
 *
 * @param {{ complaint, cause, correction, recommendations }} sections
 * @param {Array} references
 * @returns {string}
 */
export function buildTechDocument(sections, references) {
  const parts = [];

  if (sections.complaint && sections.complaint.text) {
    parts.push('COMPLAINT\n' + sections.complaint.text);
  }
  if (sections.cause && sections.cause.text) {
    parts.push('CAUSE\n' + sections.cause.text);
  }
  if (sections.correction && sections.correction.text) {
    parts.push('CORRECTION\n' + sections.correction.text);
  }
  if (sections.recommendations && sections.recommendations.text) {
    parts.push('RECOMMENDATIONS\n' + sections.recommendations.text);
  }

  // Reference list
  if (references.length > 0) {
    const refLines = references.map(
      (r) => `${r.tag} ${r.label}${r.content ? ': ' + r.content : ''}`
    );
    parts.push('REFERENCES\n' + refLines.join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * Assembles the plain-language customer document with superscript refs
 * and a numbered reference list at the bottom.
 *
 * @param {{ complaint, cause, correction, recommendations }} sections
 * @param {Array} references
 * @returns {string}
 */
export function buildCustomerDocument(sections, references) {
  // Replace [TAG-N] markers in each sentence with superscript numbers
  function _convertSentences(sectionData) {
    if (!sectionData || !sectionData.sentences) return '';
    return sectionData.sentences
      .map((s) => {
        let plain = _toPlainLanguage(s.text);
        // Replace [REF-N] pattern with superscript matching the reference index
        plain = plain.replace(/\[([A-Z]+)-(\d+)\]/g, (_match, _prefix, numStr) => {
          const refIndex = parseInt(numStr, 10);
          return _superscript(refIndex);
        });
        return plain;
      })
      .join(' ')
      .trim();
  }

  const parts = [];

  const complaintText = _convertSentences(sections.complaint);
  if (complaintText) parts.push('WHAT YOU TOLD US\n' + complaintText);

  const causeText = _convertSentences(sections.cause);
  if (causeText) parts.push('WHAT WE FOUND\n' + causeText);

  const correctionText = _convertSentences(sections.correction);
  if (correctionText) parts.push('WHAT WE DID\n' + correctionText);

  const recText = _convertSentences(sections.recommendations);
  if (recText) parts.push('OUR RECOMMENDATIONS\n' + recText);

  // Numbered reference list
  if (references.length > 0) {
    const refLines = references.map((r) => {
      const sup = _superscript(r.index);
      const label = r.label;
      return `${sup} ${label}${r.content ? ': ' + r.content : ''}`;
    });
    parts.push('REFERENCES\n' + refLines.join('\n'));
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Primary assembly function
// ---------------------------------------------------------------------------

/**
 * assembleDocument
 * Takes an ROContext from am3cPipelineService and returns a ThreeCDocument.
 *
 * @param {object} roContext
 * @returns {object} ThreeCDocument
 */
export function assembleDocument(roContext) {
  // Reference registry — each entry: { index, tag, type, label, content }
  const references = [];

  // --- Gather inputs per section ---
  const intake = roContext.intake || null;
  const classifiedNotes = roContext.classifiedNotes || [];
  const dviFindings = roContext.dviFindings || [];
  const tsbMatches = roContext.tsbMatches || [];
  const dtcCodes = roContext.dtcCodes || [];
  const partsInstalled = roContext.partsInstalled || [];
  const laborOps = roContext.laborOps || [];

  const complaintNotes = _filterNotes(classifiedNotes, 'complaint');
  const causeNotes = _filterNotes(classifiedNotes, 'cause');
  const correctionNotes = _filterNotes(classifiedNotes, 'correction');
  const recommendationNotes = _filterNotes(classifiedNotes, 'recommendation');

  const redActioned = _filterDVI(dviFindings, 'red', false);
  const yellowFindings = _filterDVI(dviFindings, 'yellow', false);
  const redDeferred = _filterDVI(dviFindings, 'red', true);
  const accepted = _acceptedTSBs(tsbMatches);

  // --- Build sections (references array grows as sections are built) ---
  const complaint = _buildComplaintSection(intake, complaintNotes, references);
  const cause = _buildCauseSection(redActioned, accepted, dtcCodes, causeNotes, references);
  const correction = _buildCorrectionSection(partsInstalled, laborOps, correctionNotes, references);
  const recommendations = _buildRecommendationsSection(yellowFindings, redDeferred, recommendationNotes, references);

  const sections = { complaint, cause, correction, recommendations };

  const techDocument = buildTechDocument(sections, references);
  const customerDocument = buildCustomerDocument(sections, references);

  return {
    roId: roContext.roId,
    vehicle: roContext.vehicle || null,
    sections,
    techDocument,
    customerDocument,
    prediiScore: null,
    revision: 1,
    assembledAt: new Date().toISOString(),
    _references: references,
  };
}

// ---------------------------------------------------------------------------
// Revision management
// ---------------------------------------------------------------------------

/**
 * createRevision
 * Creates a new revision of an existing ThreeCDocument by reassembling from
 * an updated roContext. Preserves the prior revision in history.
 *
 * @param {object} existing     - Existing ThreeCDocument
 * @param {object} roContext     - Updated ROContext
 * @returns {object} New ThreeCDocument with incremented revision number
 */
export function createRevision(existing, roContext) {
  if (!existing || typeof existing.revision !== 'number') {
    throw new Error('createRevision: existing must be a ThreeCDocument with a revision number');
  }

  const fresh = assembleDocument(roContext);

  return {
    ...fresh,
    revision: existing.revision + 1,
    previousRevision: {
      revision: existing.revision,
      assembledAt: existing.assembledAt,
      techDocument: existing.techDocument,
      customerDocument: existing.customerDocument,
      prediiScore: existing.prediiScore,
    },
  };
}
