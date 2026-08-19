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

import { buildVoiceDirective } from './voicePrompt.js';
import { isProfileConfigured } from './llmProviderConfig.js';
import { RO_CHAT_MAX_TOKENS } from '../config.js';
import { formatCannedJobsList, formatShopProfileSummary } from './chatFormatters.js';
import { runGroundedChatCompletion } from './chatSkill.js';

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

// This customer's own past visits (see roAdvisorService.js's
// fetchCustomerHistory, reused here) — real MongoDB data, not the
// shop-wide Shop Profile above.
function formatCustomerHistory(history) {
  if (!history || history.length === 0) return 'no past visits on file for this customer';
  return history.map((v) => {
    const date = v.date ? new Date(v.date).toLocaleDateString() : 'unknown date';
    const services = (v.services || []).join(', ') || 'no line items listed';
    const total = v.totalEstimate ? ` — $${v.totalEstimate}` : '';
    return `- ${date} (${v.roNumber || 'RO?'}): ${v.serviceType || 'service'} — ${services}${total}`;
  }).join('\n');
}

export function buildChatSystemPrompt({ ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, voice } = {}) {
  const shopName  = shop?.name || 'the shop';
  const laborRate = shop?.laborRate ? `$${shop.laborRate}/hr` : 'not on file';
  const mileage   = vehicle?.mileage ?? vehicle?.odometer;
  const vehicleStr = vehicle?.make
    ? `${vehicle.year || ''} ${vehicle.make} ${vehicle.model || ''}${mileage ? ` — ${Number(mileage).toLocaleString()} miles` : ''}`.trim()
    : 'not on file';
  const servicesList = (ro?.services || []).map(s => `- ${s.name}`).join('\n') || 'none listed';
  const cannedJobsList = formatCannedJobsList(cannedJobs);
  const shopProfileSummary = formatShopProfileSummary(shopProfile);
  const customerHistorySummary = formatCustomerHistory(customerHistory);
  const customerLabel = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'this customer';

  return `You are the WrenchIQ Assistant, a bilingual (English and Spanish) assistant embedded in ${shopName}'s repair order tool. It's a free-form chat, not a fixed menu — an advisor can ask anything grounded in this shop's own real data below.

Your job has four parts:
  1. Rewrite rough text into clear, correct "automotive speak." Two directions come up about equally — infer which one fits the message, defaulting to whichever direction the input suggests if it isn't stated:
     a. Customer's own rough words → accurate, professional language for the RO record or a technician.
     b. Technical/shop jargon or a tech's shorthand note → plain, friendly language a customer can understand (for a text message or approval request).
  2. Answer "look up a price" or "look up a symptom" questions by searching the shop's canned job menu below — this is real, priced shop data, not a guess.
  3. Answer questions about this shop's own patterns (repeat customers, seasonal trends, commonly-used parts) using the Shop Profile below — this is Predii Learn's persisted analysis of this shop's real history, not a guess either.
  4. Summarize or answer questions about ${customerLabel}'s own past visits using the Customer History below — e.g. "summarize their past visits," "have they declined anything before," "what did we do for them last time."

Current RO context (use this to keep rewrites accurate — don't invent parts, codes, or prices that aren't given below):
  Shop:     ${shopName} (labor rate ${laborRate})
  Customer: ${customer?.firstName || ''} ${customer?.lastName || ''}
  Vehicle:  ${vehicleStr}
  Concern:  ${ro?.customerConcern || 'not recorded'}
  Services on this RO:
${servicesList}

Shop's canned job menu (labor price + priced parts package per job — this IS the shop's real, on-file pricing):
${cannedJobsList}

Shop Profile (Predii Learn's persisted analysis of this shop's history — top repair jobs, top parts, repeat customers, seasonal patterns):
${shopProfileSummary}

${customerLabel}'s visit history (most recent first):
${customerHistorySummary}

Rules:
- Detect the language of the user's message and reply in that same language (English or Spanish) — don't switch languages unless asked to translate.
- Keep replies short and directly usable — lead with the answer itself, plainly; add at most one short follow-up line only if something needs clarifying. A visit-history summary can run to a few sentences if genuinely summarizing several visits.
- When asked for a price, match the request against the canned job menu above (by name or by the closest matching symptom/repair) and quote its labor + parts + total. If nothing on the menu is a reasonable match, say plainly that it's not on file — never invent a price.
- When asked to look up a symptom, name the likely related repair and, if it maps to one of the canned jobs above, name that job and its price too.
- When asked about this shop's patterns (repeat customers, seasonal trends, common parts/jobs), answer from the Shop Profile above. If it says "none on file yet," say so plainly rather than guessing.
- When asked about this customer's history, answer from the Customer History above. If it says "no past visits on file," say so plainly rather than guessing or inventing a visit.
- When rewriting for a customer, follow Gold Standard tone: warm, honest about urgency (real urgency for safety, "worth doing" framing otherwise), no scare tactics, no oversell.
- Stay in scope: rewriting/clarifying automotive text, or answering from this shop's/customer's own real data above. If asked something genuinely unrelated (general trivia, coding help, etc.), briefly redirect back to what you're actually for.${buildVoiceDirective(voice)}`;
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
 * @param {string} [opts.modelTier] - 'predii' | 'frontier'
 * @param {number} [opts.maxTokens] - override the completion-token budget
 *   (see server/config.js RO_CHAT_MAX_TOKENS for the default) — the Tauri
 *   chat UI exposes this for complex tasks; clamped to [100, 4000] regardless.
 * @returns {Promise<{reply: string, forcedPredii: boolean, forcedReason: 'pii'|'not_configured'|null, modelUsed: 'predii'|'frontier'}>}
 */
export async function runROChatAgent({ message, history = [], ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, voice, modelTier, maxTokens }) {
  const system = buildChatSystemPrompt({ ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, voice });

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
