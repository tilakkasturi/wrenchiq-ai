/**
 * am3cFactualityService.js
 * Factuality Enforcement Rules Engine — AE-872
 *
 * Enforces 6 non-negotiable factuality rules on every assembled 3C document
 * before finalization. Pure functions, no external imports.
 */

// ---------------------------------------------------------------------------
// 1. FACTUALITY_RULES
// ---------------------------------------------------------------------------

export const FACTUALITY_RULES = [
  {
    id: 'no_fabrication',
    name: 'No Fabrication',
    description: 'Every claim must have a source reference (e.g. [DVI-1], [RO-42]) — no assertion may appear without an audit trail marker.',
    compliantExample: 'Catalytic converter [DVI-1] efficiency below threshold per OBD scan [SCAN-3].',
    nonCompliantExample: 'The catalytic converter is failing.',
    severity: 'blocking',
  },
  {
    id: 'no_future_prediction',
    name: 'No Future-State Prediction',
    description: 'The document must not predict future failures, outcomes, or consequences — only record observed conditions.',
    compliantExample: 'Brake pad thickness measured at 2 mm [DVI-2], below manufacturer minimum of 3 mm.',
    nonCompliantExample: 'The brakes will fail if not replaced immediately.',
    severity: 'blocking',
  },
  {
    id: 'no_blame',
    name: 'No Blame',
    description: 'The document must not assign fault or blame to the customer, a previous shop, a prior mechanic, or the manufacturer.',
    compliantExample: 'Oil level was at minimum mark [DVI-5]; last service date per customer: 12 months ago.',
    nonCompliantExample: 'Customer neglected regular oil changes, causing engine damage.',
    severity: 'blocking',
  },
  {
    id: 'no_guarantees',
    name: 'No Guarantees',
    description: 'The document must not promise outcomes, cures, or permanent fixes — only describe work performed.',
    compliantExample: 'Replaced oxygen sensor [PART-A112] per OEM procedure [SB-2024-08].',
    nonCompliantExample: 'This will fix the problem. We guarantee 100% resolution.',
    severity: 'blocking',
  },
  {
    id: 'no_speculation',
    name: 'No Speculation',
    description: 'All root-cause statements must be grounded in observed evidence — speculative language is prohibited.',
    compliantExample: 'Fault code P0420 [SCAN-1] confirmed; downstream O2 sensor voltage flat [DVI-4].',
    nonCompliantExample: 'We think the issue might be the catalytic converter, probably from bad fuel.',
    severity: 'blocking',
  },
  {
    id: 'verbatim_audit',
    name: 'Verbatim Audit Preservation',
    description: 'The original technician input (rawInput) must be preserved verbatim in the audit trail whenever the document contains populated sections.',
    compliantExample: 'audit.rawInput contains the unaltered technician notes captured at write time.',
    nonCompliantExample: 'audit.rawInput is empty or undefined while Cause/Correction sections are populated.',
    severity: 'warning',
  },
];

// ---------------------------------------------------------------------------
// 2. VIOLATION_PATTERNS
// ---------------------------------------------------------------------------

export const VIOLATION_PATTERNS = {
  no_future_prediction: /\b(will fail|may cause|could lead to|will likely|might result|risk of failure|could fail)\b/gi,
  no_blame: /\b(customer (caused|damaged|neglected|ignored|abused)|previous shop|prior mechanic|manufacturer (defect|fault)|should have been)\b/gi,
  no_guarantees: /\b(this will fix|guaranteed|permanently (resolved|fixed|repaired)|we guarantee|100% fix)\b/gi,
  no_speculation: /\b(might be|probably|we think|we believe|seems like|appears to be|possibly the|I think|likely the cause|may be the)\b/gi,
};

// Regex to detect a bracketed reference marker such as [DVI-1], [RO-42], [SCAN-3], etc.
const REF_MARKER_PATTERN = /\[[A-Z]+-\w+\]/;

// Sentence boundary splitter — splits on '. ', '! ', '? ', or newlines.
const splitIntoSentences = (text) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// 3. checkRule(ruleId, text, document)
// ---------------------------------------------------------------------------

/**
 * Checks a single factuality rule against the provided text (and optionally the
 * full document for structural rules).
 *
 * @param {string} ruleId
 * @param {string} text — the text to scan
 * @param {object} [document] — the full 3C document (used by verbatim_audit)
 * @returns {{ ruleId: string, violated: boolean, matches: string[], suggestion: string }}
 */
export function checkRule(ruleId, text, document = {}) {
  const rule = FACTUALITY_RULES.find((r) => r.id === ruleId);
  if (!rule) {
    throw new Error(`Unknown rule id: "${ruleId}"`);
  }

  switch (ruleId) {
    case 'no_fabrication': {
      const sentences = splitIntoSentences(text);
      const violatingSentences = sentences.filter(
        (s) => s.length > 0 && !REF_MARKER_PATTERN.test(s)
      );
      return {
        ruleId,
        violated: violatingSentences.length > 0,
        matches: violatingSentences,
        suggestion: getRemediation({ ruleId }),
      };
    }

    case 'verbatim_audit': {
      const hasSections =
        (document.sections && Object.keys(document.sections).length > 0) ||
        (document.complaint && document.complaint.trim().length > 0) ||
        (document.cause && document.cause.trim().length > 0) ||
        (document.correction && document.correction.trim().length > 0);

      const rawInputMissing =
        !document.audit ||
        !document.audit.rawInput ||
        document.audit.rawInput.trim().length === 0;

      const violated = hasSections && rawInputMissing;
      return {
        ruleId,
        violated,
        matches: violated ? ['audit.rawInput is missing or empty'] : [],
        suggestion: getRemediation({ ruleId }),
      };
    }

    default: {
      const pattern = VIOLATION_PATTERNS[ruleId];
      if (!pattern) {
        return { ruleId, violated: false, matches: [], suggestion: '' };
      }

      // Reset lastIndex for global regex reuse.
      pattern.lastIndex = 0;
      const matches = [];
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push(match[0]);
      }
      // Reset again after use so callers don't see stale state.
      pattern.lastIndex = 0;

      return {
        ruleId,
        violated: matches.length > 0,
        matches: [...new Set(matches)],
        suggestion: getRemediation({ ruleId }),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// 4. validateDocument(document)
// ---------------------------------------------------------------------------

/**
 * Runs all 6 factuality rules against the assembled 3C document.
 *
 * Expected document shape (all fields optional):
 * {
 *   complaint:   string,
 *   cause:       string,
 *   correction:  string,
 *   sections:    { [key]: string },      // merged sections map
 *   audit: {
 *     rawInput:  string,
 *     [other]:   any,
 *   },
 * }
 *
 * @param {object} document
 * @returns {{ violations: RuleViolation[], passed: boolean, violationCount: number }}
 */
export function validateDocument(document) {
  const violations = [];

  const complaint = document.complaint || '';
  const cause = document.cause || '';
  const correction = document.correction || '';
  const fullText = [complaint, cause, correction].filter(Boolean).join(' ');

  // Rule 1 — no_fabrication: check Cause + Correction sentences for missing [REF] markers.
  const fabricationText = [cause, correction].filter(Boolean).join(' ');
  if (fabricationText.trim().length > 0) {
    const result = checkRule('no_fabrication', fabricationText, document);
    if (result.violated) {
      result.matches.forEach((sentence) => {
        violations.push(_buildViolation('no_fabrication', sentence, sentence, document));
      });
    }
  }

  // Rules 2–5 — pattern-based checks on the full text.
  const patternRules = [
    'no_future_prediction',
    'no_blame',
    'no_guarantees',
    'no_speculation',
  ];

  if (fullText.trim().length > 0) {
    patternRules.forEach((ruleId) => {
      const result = checkRule(ruleId, fullText, document);
      if (result.violated) {
        // Find the sentence containing each match for reporting.
        const sentences = splitIntoSentences(fullText);
        result.matches.forEach((matchStr) => {
          const sentence = sentences.find((s) =>
            s.toLowerCase().includes(matchStr.toLowerCase())
          ) || matchStr;
          violations.push(_buildViolation(ruleId, sentence, matchStr, document));
        });
      }
    });
  }

  // Rule 6 — verbatim_audit: structural check.
  const auditResult = checkRule('verbatim_audit', fullText, document);
  if (auditResult.violated) {
    violations.push(
      _buildViolation('verbatim_audit', auditResult.matches[0], auditResult.matches[0], document)
    );
  }

  return {
    violations,
    passed: violations.length === 0,
    violationCount: violations.length,
  };
}

// Internal helper — constructs a RuleViolation object.
function _buildViolation(ruleId, sentence, match, _document) {
  const rule = FACTUALITY_RULES.find((r) => r.id === ruleId);
  return {
    ruleId,
    ruleName: rule ? rule.name : ruleId,
    sentence,
    match,
    suggestion: getRemediation({ ruleId }),
    severity: rule ? rule.severity : 'blocking',
    resolved: false,
    resolvedAt: null,
  };
}

// ---------------------------------------------------------------------------
// 5. getRemediation(violation)
// ---------------------------------------------------------------------------

/**
 * Returns a specific suggestion string for fixing the given violation.
 *
 * @param {{ ruleId: string }} violation
 * @returns {string}
 */
export function getRemediation(violation) {
  const remediations = {
    no_fabrication:
      'Add a bracketed source reference (e.g. [DVI-1], [SCAN-2], [RO-7]) to every factual claim in the Cause and Correction sections.',
    no_future_prediction:
      'Remove forward-looking language. Restate the condition as an observed measurement or confirmed fault code rather than a prediction.',
    no_blame:
      'Remove blame attribution. Describe the observed condition objectively without referencing who or what caused it.',
    no_guarantees:
      'Remove guarantee language. Describe the work performed and parts replaced; do not promise outcomes or permanent resolution.',
    no_speculation:
      'Replace speculative language with confirmed diagnostic evidence. Cite fault codes, measurements, or inspection findings.',
    verbatim_audit:
      'Ensure audit.rawInput is populated with the unaltered technician notes before finalizing the document.',
  };

  return remediations[violation.ruleId] || 'Review and correct the flagged language before finalizing.';
}

// ---------------------------------------------------------------------------
// 6. canSendToCustomer(document, violations, minScore)
// ---------------------------------------------------------------------------

/**
 * Returns true only when the document is safe to deliver to the customer:
 *   - No unresolved violations
 *   - Complaint and Correction sections are populated
 *   - prediiScore.total >= minScore (default 60)
 *
 * @param {object} document
 * @param {RuleViolation[]} violations
 * @param {number} [minScore=60]
 * @returns {boolean}
 */
export function canSendToCustomer(document, violations, minScore = 60) {
  const unresolvedViolations = (violations || []).filter((v) => v.resolved !== true);
  if (unresolvedViolations.length > 0) return false;

  const complaintPopulated = typeof document.complaint === 'string' && document.complaint.trim().length > 0;
  const correctionPopulated = typeof document.correction === 'string' && document.correction.trim().length > 0;
  if (!complaintPopulated || !correctionPopulated) return false;

  const score =
    document.prediiScore && typeof document.prediiScore.total === 'number'
      ? document.prediiScore.total
      : 0;
  if (score < minScore) return false;

  return true;
}

// ---------------------------------------------------------------------------
// 7. resolveViolation(violation)
// ---------------------------------------------------------------------------

/**
 * Returns an updated copy of the violation marked as resolved.
 *
 * @param {RuleViolation} violation
 * @returns {RuleViolation}
 */
export function resolveViolation(violation) {
  return {
    ...violation,
    resolved: true,
    resolvedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 8. getRuleDefinitions()
// ---------------------------------------------------------------------------

/**
 * Returns FACTUALITY_RULES formatted for the Admin settings display.
 * Each entry includes an `index` (1-based) for ordered presentation.
 *
 * @returns {object[]}
 */
export function getRuleDefinitions() {
  return FACTUALITY_RULES.map((rule, i) => ({
    index: i + 1,
    id: rule.id,
    name: rule.name,
    description: rule.description,
    compliantExample: rule.compliantExample,
    nonCompliantExample: rule.nonCompliantExample,
    severity: rule.severity,
    hasPattern: Object.prototype.hasOwnProperty.call(VIOLATION_PATTERNS, rule.id),
  }));
}
