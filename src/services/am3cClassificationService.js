// ============================================================
// AM 3C Classification Service — AE-868
// LLM Classification Engine for auto-sorting tech notes into
// Complaint / Cause / Correction / Recommendation sections.
// Demo mode only — simulates LLM classification via heuristics.
// No real API calls are made in this prototype.
// ============================================================

// ============================================================
// Exported constants
// ============================================================

export const SECTIONS = ['complaint', 'cause', 'correction', 'recommendation'];

export const CONFIDENCE_THRESHOLDS = {
  AUTO: 0.90,
  REVIEW: 0.70,
};

// ============================================================
// Internal helpers
// ============================================================

let _noteIdCounter = 1;

function _generateId() {
  return `note_${Date.now()}_${_noteIdCounter++}`;
}

/**
 * Simulated delay between 100–400ms to mimic LLM latency.
 */
function _simulatedDelay() {
  const ms = 100 + Math.floor(Math.random() * 300);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Seeded pseudo-random variation within a range using text as seed.
 * Keeps results deterministic for the same input text.
 */
function _deterministicVariation(text, min, max) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const ratio = (hash % 1000) / 1000;
  return min + ratio * (max - min);
}

// ============================================================
// Heuristic rules — ordered by priority
// ============================================================

const HEURISTIC_RULES = [
  {
    section: 'complaint',
    test(lower) {
      return (
        lower.startsWith('customer states') ||
        lower.startsWith('customer reports') ||
        lower.startsWith('customer complains') ||
        lower.startsWith('owner states') ||
        /\b(noise|smell|vibration|shimmy|pull|hesitation|stall|rough|hard to|won't|won\'t|doesn't|doesn\'t|intermittent)\b/.test(lower) &&
          /\?/.test(lower) === false &&
          /\b(customer|owner|driver|operator)\b/.test(lower)
      );
    },
    confidenceRange: [0.88, 0.97],
  },
  {
    section: 'correction',
    test(lower) {
      return /\b(replaced|installed|performed|completed|reprogrammed|cleared|adjusted|torqued|filled|flushed|serviced|resurfaced|resealed|rebuilt|reset|updated|lubricated|tightened|removed and replaced|r&r)\b/.test(lower);
    },
    confidenceRange: [0.87, 0.94],
  },
  {
    section: 'recommendation',
    test(lower) {
      return /\b(recommend|suggest|advise|should|will need|monitor|upcoming|deferred|schedule|due|overdue|inspect at|due at|next visit)\b/.test(lower);
    },
    confidenceRange: [0.85, 0.93],
  },
  {
    section: 'cause',
    test(lower) {
      return /\b(found|diagnosed|confirmed|scan revealed|dtc|p0|b0|c0|u0|failed|worn|cracked|leaking|low|defective|seized|corroded|broken|damaged|stripped|burnt|shorted|open circuit|high resistance|out of spec|contaminated|plugged|clogged|collapsed|bent|misaligned|loose)\b/.test(lower);
    },
    confidenceRange: [0.88, 0.95],
  },
];

/**
 * Runs all heuristic rules against lowercased text and returns the
 * best match, or null if none match.
 */
function _runHeuristics(text) {
  const lower = text.toLowerCase().trim();

  for (const rule of HEURISTIC_RULES) {
    if (rule.test(lower)) {
      return {
        section: rule.section,
        confidenceRange: rule.confidenceRange,
      };
    }
  }

  return null;
}

/**
 * Derives status string from a numeric confidence value.
 */
function _statusFromConfidence(confidence) {
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO) return 'auto';
  if (confidence >= CONFIDENCE_THRESHOLDS.REVIEW) return 'review';
  return 'flagged';
}

/**
 * Selects the model label based on confidence.
 * Lower confidence triggers the more powerful model label.
 */
function _modelFromConfidence(confidence) {
  return confidence < CONFIDENCE_THRESHOLDS.REVIEW
    ? 'claude-opus-4-6'
    : 'claude-sonnet-4-6';
}

// ============================================================
// Primary classification function
// ============================================================

/**
 * Classifies a single technician note into one of the 3C sections.
 *
 * @param {string} text             - Raw tech note text
 * @param {object} vehicleContext   - Optional vehicle context (YMME, mileage, etc.)
 * @param {boolean} demoMode        - Always true for this prototype; real LLM path reserved
 * @returns {Promise<ClassifiedNote>}
 *
 * @typedef {object} ClassifiedNote
 * @property {string} id
 * @property {string} text
 * @property {'complaint'|'cause'|'correction'|'recommendation'} section
 * @property {number} confidence  - 0.0–1.0
 * @property {'auto'|'review'|'flagged'} status
 * @property {string} model
 */
export async function classifyNote(text, vehicleContext = {}, demoMode = true) {
  if (demoMode) {
    await _simulatedDelay();

    const match = _runHeuristics(text);

    let section, confidence;

    if (match) {
      const [min, max] = match.confidenceRange;
      confidence = _deterministicVariation(text, min, max);
      section = match.section;
    } else {
      // No heuristic matched — flag as ambiguous cause
      confidence = _deterministicVariation(text, 0.62, 0.68);
      section = 'cause';
    }

    const status = _statusFromConfidence(confidence);
    const model = _modelFromConfidence(confidence);

    return {
      id: _generateId(),
      text,
      section,
      confidence: Math.round(confidence * 1000) / 1000,
      status,
      model,
    };
  }

  // Real LLM path (not implemented in this prototype)
  throw new Error(
    'classifyNote: live LLM mode is not implemented. Use demoMode = true.'
  );
}

// ============================================================
// Batch classification
// ============================================================

/**
 * Classifies an array of tech note strings in parallel.
 *
 * @param {string[]} notes
 * @param {object} vehicleContext
 * @param {boolean} demoMode
 * @returns {Promise<ClassifiedNote[]>}
 */
export async function classifyBatch(notes, vehicleContext = {}, demoMode = true) {
  if (!Array.isArray(notes)) {
    throw new TypeError('classifyBatch: notes must be an array of strings');
  }

  return Promise.all(
    notes.map((note) => classifyNote(note, vehicleContext, demoMode))
  );
}

// ============================================================
// PII tokenization
// ============================================================

/**
 * Replaces recognizable PII in text with positional tokens.
 * Handles: customer names (Title Case words), US phone numbers,
 * and US-style street addresses.
 *
 * @param {string} text
 * @returns {{ tokenized: string, tokens: Record<string, string> }}
 */
export function tokenizePII(text) {
  const tokens = {};
  let tokenized = text;
  let phoneIndex = 1;
  let nameIndex = 1;
  let addressIndex = 1;

  // Phone numbers: (555) 123-4567 | 555-123-4567 | 5551234567 | +1-555-123-4567
  tokenized = tokenized.replace(
    /(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g,
    (match) => {
      const key = `[PHONE_${phoneIndex++}]`;
      tokens[key] = match;
      return key;
    }
  );

  // Street addresses: digits followed by street name + type
  tokenized = tokenized.replace(
    /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St(?:reet)?|Ave(?:nue)?|Blvd|Rd|Road|Dr(?:ive)?|Ln|Lane|Ct|Court|Way|Pl(?:ace)?|Pkwy)\b/g,
    (match) => {
      const key = `[ADDRESS_${addressIndex++}]`;
      tokens[key] = match;
      return key;
    }
  );

  // Customer names: two or more consecutive Title Case words not already tokenized
  // Excludes common automotive terms that happen to be Title Case
  const AUTO_TERMS = new Set([
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Chevy', 'Dodge', 'Jeep',
    'Nissan', 'Subaru', 'Hyundai', 'Kia', 'Mazda', 'Volkswagen', 'BMW',
    'Mercedes', 'Audi', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Buick',
    'GMC', 'Ram', 'Chrysler', 'Lincoln', 'Volvo', 'Porsche', 'Tesla',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
    'Customer', 'Owner', 'Technician', 'Tech', 'Advisor', 'Service',
  ]);

  tokenized = tokenized.replace(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    (match) => {
      const words = match.split(/\s+/);
      if (words.some((w) => AUTO_TERMS.has(w))) return match;
      const key = `[CUSTOMER_${nameIndex++}]`;
      tokens[key] = match;
      return key;
    }
  );

  return { tokenized, tokens };
}

/**
 * Reverses tokenization — restores original PII values from the token map.
 *
 * @param {string} text       - Tokenized string
 * @param {Record<string, string>} tokens - Token map returned by tokenizePII
 * @returns {string}
 */
export function detokenizePII(text, tokens) {
  let result = text;
  for (const [token, original] of Object.entries(tokens)) {
    // Escape brackets for regex safety
    const escaped = token.replace(/[[\]]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), original);
  }
  return result;
}

// ============================================================
// Manual override
// ============================================================

/**
 * Overrides the section classification of a note (e.g. after a tech
 * manually drags a note to a different column in the UI).
 *
 * @param {ClassifiedNote} classifiedNote
 * @param {'complaint'|'cause'|'correction'|'recommendation'} newSection
 * @returns {ClassifiedNote}
 */
export function overrideClassification(classifiedNote, newSection) {
  if (!SECTIONS.includes(newSection)) {
    throw new Error(
      `overrideClassification: invalid section "${newSection}". Must be one of: ${SECTIONS.join(', ')}`
    );
  }

  return {
    ...classifiedNote,
    section: newSection,
    confidence: 1.0,
    status: 'auto',
    model: classifiedNote.model,
    _originalSection: classifiedNote._originalSection ?? classifiedNote.section,
  };
}
