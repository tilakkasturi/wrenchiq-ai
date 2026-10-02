/**
 * WrenchIQ — RO Chat Assistant
 *
 * Bilingual (English/Spanish) chat helper embedded in the RO tool. Grounded
 * in this shop's own real data — the active RO (vehicle, concern, services),
 * the canned-job price menu, the persisted Predii Learn Shop Profile, and
 * this customer's own visit history — so it can rewrite text, look up
 * prices/symptoms, answer shop-pattern questions, and summarize a
 * customer's past visits, all without inventing anything not actually on
 * file.
 *
 * Still not a general-purpose chatbot — redirects anything unrelated to
 * this shop/RO/customer back to what it's for.
 */

import { voiceDirectiveText } from './voicePrompt.js';
import { promptSection } from './promptLoader.js';
import { isProfileConfigured } from './llmProviderConfig.js';
import { RO_CHAT_MAX_TOKENS } from '../config.js';
import { formatCannedJobsList, formatShopProfileSummary } from './chatFormatters.js';
import { runGroundedChatCompletion } from './chatSkill.js';

const FILE = 'ro-chat-system';

const MIN_MAX_TOKENS = 100;
const MAX_MAX_TOKENS = 4000; // hard ceiling — the Tauri UI's override is clamped to this regardless of what's requested

function clampMaxTokens(requested) {
  const n = parseInt(requested, 10);
  if (!Number.isFinite(n)) return RO_CHAT_MAX_TOKENS;
  return Math.min(Math.max(n, MIN_MAX_TOKENS), MAX_MAX_TOKENS);
}

// V5 feedback (D3): a message referencing customer-identifying data stays
// on the Predii-managed model regardless of the shop's tier toggle — a
// simple heuristic, not a full PII classifier, but a real guardrail rather
// than none. Checked against the raw message text only (not RO context,
// which the model needs regardless of tier).
const PII_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,                 // phone number
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // email
  /\b[A-HJ-NPR-Z0-9]{17}\b/,                            // VIN (17 chars, no I/O/Q)
  /\b\d{1,5}\s+\w+\s+(street|st|ave|avenue|rd|road|blvd|dr|drive|ln|lane)\b/i, // street address
];

export function containsLikelyPII(text) {
  return PII_PATTERNS.some(re => re.test(text || ''));
}

/**
 * Resolves which LLM profile to actually call for a chat turn.
 *
 * 'frontier' is a genuinely separate endpoint (its own base URL/key/model —
 * see llmProviderConfig.js's 'frontier' profile), not a model-name override
 * on top of whatever the Settings "AI Engine" toggle has active. Falls back
 * to Predii LLM (profileKey: undefined → useConfiguredProvider) whenever the
 * frontier tier can't actually be used, and says why via forcedReason so the
 * UI can tell the advisor what actually happened instead of silently
 * pretending the toggle worked.
 *
 * @returns {{ profileKey: string|undefined, forcedPredii: boolean, forcedReason: 'pii'|'not_configured'|null }}
 */
export function resolveModelTier(modelTier, message) {
  if (modelTier !== 'frontier') {
    return { profileKey: undefined, forcedPredii: false, forcedReason: null };
  }
  if (containsLikelyPII(message)) {
    return { profileKey: undefined, forcedPredii: true, forcedReason: 'pii' };
  }
  if (!isProfileConfigured('frontier')) {
    return { profileKey: undefined, forcedPredii: true, forcedReason: 'not_configured' };
  }
  return { profileKey: 'frontier', forcedPredii: false, forcedReason: null };
}

// serviceType is the RO's raw internal serviceCategory field (see
// fetchCustomerHistory) — shop taxonomy, not customer/advisor-facing
// language. "factory_oem" means "manufacturer-scheduled maintenance
// package," not literally "OEM" or "factory" — mapped so the model doesn't
// parrot the raw code back to an advisor in a summary or talking point.
const SERVICE_CATEGORY_LABELS = {
  factory_oem: 'maintenance',
  other_mechanical: 'general repair',
  ac: 'A/C',
  climate_control: 'A/C',
  engine_emissions: 'engine/emissions',
};
function humanizeServiceCategory(cat) {
  if (!cat) return 'service';
  if (SERVICE_CATEGORY_LABELS[cat]) return SERVICE_CATEGORY_LABELS[cat];
  return cat.replace(/_/g, ' ');
}

// This customer's own past visits (see roAdvisorService.js's
// fetchCustomerHistory, reused here) — real MongoDB data, not the
// shop-wide Shop Profile above.
function formatCustomerHistory(history) {
  if (!history || history.length === 0) return promptSection(FILE, 'history-none');
  return history.map((v) => {
    const date = v.date ? new Date(v.date).toLocaleDateString() : promptSection(FILE, 'date-unknown');
    const services = (v.services || []).join(', ') || promptSection(FILE, 'history-no-items');
    const total = v.totalEstimate ? ` — $${v.totalEstimate}` : '';
    return `- ${date} (${v.roNumber || 'RO?'}): ${humanizeServiceCategory(v.serviceType)} — ${services}${total}`;
  }).join('\n');
}

// Personal notes an advisor saved about this customer (customerNotesService.js)
// — e.g. "prefers texts over calls," "picky about noise complaints." These
// are the one piece of context here that's *only* ever advisor-authored, so
// they're presented as-is rather than summarized/interpreted.
function formatCustomerNotes(notes) {
  if (!notes || notes.length === 0) return promptSection(FILE, 'notes-none');
  return notes.map((n) => {
    const date = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : promptSection(FILE, 'date-unknown');
    return `- (${date}) ${n.note}`;
  }).join('\n');
}

// Beyond the default English/Spanish auto-detect, an advisor can force a
// reply language explicitly (e.g. a Vietnamese- or Mandarin-speaking
// customer's text needs translating the other direction) — see LANGUAGES in
// WrenchIQSidecarScreen.jsx for the matching client-side picker.
const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  zh: 'Mandarin Chinese',
  vi: 'Vietnamese',
  de: 'German',
  fr: 'French',
};

// The prompt wording lives in prompts/ro-chat-system.md (section "system");
// this only computes the values it renders.
export function buildChatSystemPrompt({ ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, customerNotes, voice, language } = {}) {
  const mileage = vehicle?.mileage ?? vehicle?.odometer;
  const vehicleBase = vehicle?.make ? `${vehicle.year || ''} ${vehicle.make} ${vehicle.model || ''}` : '';
  const customerName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ');

  return promptSection(FILE, 'system', {
    shopName:               shop?.name || promptSection(FILE, 'shop-fallback'),
    laborRate:              shop?.laborRate ? String(shop.laborRate) : '',
    customerFirst:          String(customer?.firstName || ''),
    customerLast:           String(customer?.lastName || ''),
    customerLabel:          customerName || promptSection(FILE, 'customer-fallback'),
    hasVehicle:             !!vehicle?.make,
    vehicleDesc:            mileage ? vehicleBase.trimStart() : vehicleBase.trim(),
    mileage:                mileage ? Number(mileage).toLocaleString() : '',
    concern:                ro?.customerConcern ? String(ro.customerConcern) : '',
    servicesList:           (ro?.services || []).map(s => `- ${s.name}`).join('\n'),
    cannedJobsList:         formatCannedJobsList(cannedJobs),
    shopProfileSummary:     formatShopProfileSummary(shopProfile),
    customerHistorySummary: formatCustomerHistory(customerHistory),
    customerNotesSummary:   formatCustomerNotes(customerNotes),
    languageName:           (language && LANGUAGE_NAMES[language]) || '',
    voiceDirective:         voiceDirectiveText(voice),
  });
}

/**
 * @param {object} opts
 * @param {string} opts.message
 * @param {Array<{role:'user'|'assistant', text:string}>} [opts.history]
 * @param {object} opts.ro       - Current RO (services[], customerConcern)
 * @param {object} opts.customer - {firstName, lastName}
 * @param {object} opts.vehicle  - {year, make, model, mileage|odometer}
 * @param {object} opts.shop     - {name, laborRate}
 * @param {Array}  [opts.cannedJobs] - shop's priced canned-job menu (see cannedJobsService.js)
 * @param {object} [opts.shopProfile] - persisted Predii Learn shop profile (see shopProfileSnapshotService.js)
 * @param {Array}  [opts.customerHistory] - this customer's past visits (see roAdvisorService.js fetchCustomerHistory)
 * @param {Array}  [opts.customerNotes] - advisor-saved personal notes about this customer (see customerNotesService.js)
 * @param {string} [opts.modelTier] - 'predii' | 'frontier'
 * @param {string} [opts.language] - force a reply language ('en'|'es'|'zh'|'vi') instead of auto-detecting from the message
 * @param {number} [opts.maxTokens] - override the completion-token budget
 *   (see server/config.js RO_CHAT_MAX_TOKENS for the default) — the Tauri
 *   chat UI exposes this for complex tasks; clamped to [100, 4000] regardless.
 * @returns {Promise<{reply: string, forcedPredii: boolean, forcedReason: 'pii'|'not_configured'|null, modelUsed: 'predii'|'frontier'}>}
 */
export async function runROChatAgent({ message, history = [], ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, customerNotes, voice, modelTier, language, maxTokens }) {
  const system = buildChatSystemPrompt({ ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, customerNotes, voice, language });

  const { profileKey, forcedPredii, forcedReason } = resolveModelTier(modelTier, message);

  const effectiveMaxTokens = clampMaxTokens(maxTokens);

  const reply = await runGroundedChatCompletion({
    system,
    history,
    message,
    maxTokens: effectiveMaxTokens,
    route: '/api/ro-chat',
    profileKey,
    useConfiguredProvider: !profileKey,
  });

  return {
    reply,
    forcedPredii,
    forcedReason,
    modelUsed: profileKey ? 'frontier' : 'predii',
  };
}
