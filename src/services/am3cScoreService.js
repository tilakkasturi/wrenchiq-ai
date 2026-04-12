/**
 * am3cScoreService.js
 * Predii Score Engine — 3C Narrative Data-Grounding Scorer
 * Jira AE-870
 *
 * Computes a 0-100 integer measuring how well a 3C narrative is
 * grounded in real data across three dimensions:
 *   - Source Coverage   (40 pts)
 *   - Factual Compliance (40 pts)
 *   - Completeness       (20 pts)
 *
 * Pure functions. No external imports.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SCORE_WEIGHTS = {
  sourceCoverage:    40,
  factualCompliance: 40,
  completeness:      20,
};

export const SCORE_LABELS = {
  excellent:   { min: 90, label: 'Excellent',    color: '#16A34A' },
  good:        { min: 75, label: 'Good',          color: '#2563EB' },
  fair:        { min: 60, label: 'Fair',          color: '#D97706' },
  needsReview: { min:  0, label: 'Needs Review',  color: '#DC2626' },
};

// Source reference marker pattern — matches [DVI-N], [TSB-N], [DTC-N],
// [TECH-N], [PART-N], [INTAKE-N] where N is one or more digits.
const SOURCE_MARKER_RE = /\[(DVI|TSB|DTC|TECH|PART|INTAKE)-\d+\]/i;

// Sentence splitter — split on . ! ? followed by whitespace or end-of-string.
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+|(?<=[.!?])$/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Split text into non-empty sentences.
 * @param {string} text
 * @returns {string[]}
 */
function _splitSentences(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(SENTENCE_SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Count how many sentences in an array contain at least one source marker.
 * @param {string[]} sentences
 * @returns {number}
 */
function _countSourced(sentences) {
  return sentences.filter((s) => SOURCE_MARKER_RE.test(s)).length;
}

/**
 * Extract cause + correction text from a document object.
 * Accepts flexible property shapes from the pipeline.
 * @param {object} document
 * @returns {string[]} flat array of sentences
 */
function _causeCorrectionSentences(document) {
  if (!document || typeof document !== 'object') return [];

  const getText = (val) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
      // Common shapes: { text }, { content }, { narrative }
      return val.text || val.content || val.narrative || '';
    }
    return '';
  };

  const causeText      = getText(document.cause);
  const correctionText = getText(document.correction);
  const combined       = [causeText, correctionText].join(' ');
  return _splitSentences(combined);
}

// ---------------------------------------------------------------------------
// Scoring sub-components
// ---------------------------------------------------------------------------

/**
 * Compute Source Coverage score (0–40).
 * Proportion of Cause + Correction sentences that carry a source reference.
 * @param {object} document
 * @returns {number}
 */
function _computeSourceCoverage(document) {
  const sentences = _causeCorrectionSentences(document);
  if (sentences.length === 0) return 0;

  const sourced    = _countSourced(sentences);
  const proportion = sourced / sentences.length;
  return Math.round(SCORE_WEIGHTS.sourceCoverage * proportion);
}

/**
 * Compute Factual Compliance score (0–40).
 * Starts at 40, deducts 8 per violation. Floor 0.
 * @param {string[]} violations
 * @returns {number}
 */
function _computeFactualCompliance(violations) {
  if (!Array.isArray(violations) || violations.length === 0) {
    return SCORE_WEIGHTS.factualCompliance;
  }
  const deduction = violations.length * 8;
  return Math.max(0, SCORE_WEIGHTS.factualCompliance - deduction);
}

/**
 * Compute Completeness score (0–20).
 * 4 pts each for: document existing, complaint, cause, correction, recommendations.
 * @param {object} document
 * @returns {number}
 */
function _computeCompleteness(document) {
  if (!document || typeof document !== 'object') return 0;

  const hasSection = (key) => {
    const val = document[key];
    if (!val) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'object') {
      const text = val.text || val.content || val.narrative || '';
      return typeof text === 'string' && text.trim().length > 0;
    }
    return false;
  };

  // The 5 checkpoints, 4 pts each
  const checks = [
    true,                            // document exists
    hasSection('complaint'),
    hasSection('cause'),
    hasSection('correction'),
    hasSection('recommendations') || hasSection('recommendation'),
  ];

  const passed = checks.filter(Boolean).length;
  return passed * 4;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getScoreLabel
 * Returns the SCORE_LABELS entry for a given total score.
 * @param {number} total  0-100
 * @returns {{ min: number, label: string, color: string }}
 */
export function getScoreLabel(total) {
  const t = typeof total === 'number' ? total : 0;
  if (t >= SCORE_LABELS.excellent.min)   return SCORE_LABELS.excellent;
  if (t >= SCORE_LABELS.good.min)        return SCORE_LABELS.good;
  if (t >= SCORE_LABELS.fair.min)        return SCORE_LABELS.fair;
  return SCORE_LABELS.needsReview;
}

/**
 * computeScore
 * Computes the full Predii Score from an assembled document and violation list.
 *
 * @param {object}   document   - Assembled 3C narrative document.
 *   Expected shape: { complaint, cause, correction, recommendations, ... }
 *   Each section may be a string or { text, content, narrative, ... }.
 * @param {string[]} violations - Array of factuality violation strings.
 * @returns {PrediScore}
 *
 * @typedef {object} PrediScore
 * @property {number}   total              - 0-100 overall score
 * @property {number}   sourceCoverage     - 0-40
 * @property {number}   factualCompliance  - 0-40
 * @property {number}   completeness       - 0-20
 * @property {string[]} violations         - echo of input violations
 * @property {string}   computedAt         - ISO timestamp
 * @property {string}   label              - e.g. "Excellent"
 * @property {string}   labelColor         - hex color
 */
export function computeScore(document, violations) {
  const safeViolations = Array.isArray(violations) ? violations : [];

  const sourceCoverage    = _computeSourceCoverage(document);
  const factualCompliance = _computeFactualCompliance(safeViolations);
  const completeness      = _computeCompleteness(document);
  const total             = Math.min(100, sourceCoverage + factualCompliance + completeness);

  const labelObj = getScoreLabel(total);

  return {
    total,
    sourceCoverage,
    factualCompliance,
    completeness,
    violations:  safeViolations,
    computedAt:  new Date().toISOString(),
    label:       labelObj.label,
    labelColor:  labelObj.color,
  };
}

/**
 * getScoreExplanation
 * Returns a one-sentence plain-language explanation for the document footer.
 * @param {PrediScore} score
 * @returns {string}
 */
export function getScoreExplanation(score) {
  if (!score || typeof score.total !== 'number') {
    return 'Score could not be computed for this document.';
  }

  const label = score.label || getScoreLabel(score.total).label;
  const total = score.total;

  switch (label) {
    case 'Excellent':
      return `This document achieved an Excellent Predii Score of ${total}, meaning every finding is traced to a verified source with full compliance.`;
    case 'Good':
      return `This document achieved a Good Predii Score of ${total}, meaning most findings are source-referenced with minor compliance gaps.`;
    case 'Fair':
      return `This document achieved a Fair Predii Score of ${total}; some findings lack source references or have compliance issues that should be reviewed.`;
    case 'Needs Review':
    default:
      return `This document scored ${total} and Needs Review — significant source coverage or compliance gaps were detected before finalizing.`;
  }
}

/**
 * getDimensionBreakdown
 * Returns an array of dimension objects for rendering score bars in the UI.
 * @param {PrediScore} score
 * @returns {Array<{ label: string, value: number, maxValue: number, color: string }>}
 */
export function getDimensionBreakdown(score) {
  if (!score) return [];

  return [
    {
      label:    'Source Coverage',
      value:    typeof score.sourceCoverage    === 'number' ? score.sourceCoverage    : 0,
      maxValue: SCORE_WEIGHTS.sourceCoverage,
      color:    '#2563EB',
    },
    {
      label:    'Factual Compliance',
      value:    typeof score.factualCompliance === 'number' ? score.factualCompliance : 0,
      maxValue: SCORE_WEIGHTS.factualCompliance,
      color:    '#0D3B45',
    },
    {
      label:    'Completeness',
      value:    typeof score.completeness      === 'number' ? score.completeness      : 0,
      maxValue: SCORE_WEIGHTS.completeness,
      color:    '#FF6B35',
    },
  ];
}

/**
 * computeQuickScore
 * Lightweight score estimate from an ROContext alone, before full narrative
 * assembly. Used for the live panel gauge.
 *
 * Heuristic mapping:
 *   - Completeness proxy: 4 pts per completed required stage
 *     (customer_intake, tech_notes, work_performed, final_review) — max 20 pts
 *   - Source coverage proxy: scales by number of DVI + TSB + DTC sources,
 *     capped at 40 pts (each source contributes ~8 pts, plateau at 5+)
 *   - Factual compliance proxy: 40 pts minus 8 per classified note flagged
 *     as conflicting (roContext.classifiedNotes with flag === 'conflict')
 *
 * @param {object} roContext  ROContext object from am3cPipelineService
 * @returns {PrediScore}  A score object with estimated values
 */
export function computeQuickScore(roContext) {
  if (!roContext || typeof roContext !== 'object') {
    return computeScore(null, []);
  }

  // --- Completeness proxy ---
  const REQUIRED_STAGES = ['customer_intake', 'tech_notes', 'work_performed', 'final_review'];
  const history = Array.isArray(roContext.stageHistory) ? roContext.stageHistory : [];
  const completedIds = new Set(
    history
      .filter((h) => h && !h.skipped)
      .map((h) => h.stageId)
  );
  // Also count currentStage as completed if it is one of the required stages
  if (roContext.currentStage) completedIds.add(roContext.currentStage);

  const completedRequired = REQUIRED_STAGES.filter((id) => completedIds.has(id)).length;
  const completeness = completedRequired * 4; // 0-16 from stages; +4 for doc existing later

  // --- Source coverage proxy ---
  const dviCount   = Array.isArray(roContext.dviFindings)  ? roContext.dviFindings.length  : 0;
  const tsbCount   = Array.isArray(roContext.tsbMatches)   ? roContext.tsbMatches.length   : 0;
  const dtcCount   = Array.isArray(roContext.dtcCodes)     ? roContext.dtcCodes.length     :
                     (Array.isArray(roContext.diagnostics)  ? roContext.diagnostics.length  : 0);
  const totalSources = dviCount + tsbCount + dtcCount;
  // Each source worth ~8 pts, plateaus at 5 sources = full 40 pts
  const sourceCoverage = Math.min(SCORE_WEIGHTS.sourceCoverage, totalSources * 8);

  // --- Factual compliance proxy ---
  const classifiedNotes = Array.isArray(roContext.classifiedNotes) ? roContext.classifiedNotes : [];
  const conflictCount   = classifiedNotes.filter(
    (n) => n && (n.flag === 'conflict' || n.conflict === true)
  ).length;
  const factualCompliance = Math.max(0, SCORE_WEIGHTS.factualCompliance - conflictCount * 8);

  const total    = Math.min(100, sourceCoverage + factualCompliance + completeness);
  const labelObj = getScoreLabel(total);

  return {
    total,
    sourceCoverage,
    factualCompliance,
    completeness,
    violations:  [],
    computedAt:  new Date().toISOString(),
    label:       labelObj.label,
    labelColor:  labelObj.color,
  };
}
