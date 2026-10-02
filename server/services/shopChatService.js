/**
 * WrenchIQ — Shop Chat Assistant
 *
 * A shop-wide free-form chat — not scoped to any open RO. Grounded in the
 * same three real data sources as RO Chat (canned-job menu, persisted Shop
 * Profile, a named customer's visit history), but usable from the queue/
 * dashboard level without selecting an RO first. Always runs on the default
 * Predii LLM — no frontier-model tier here, this is the shop-wide "ask
 * anything" surface, not the per-RO power-user tool.
 */

import { RO_CHAT_MAX_TOKENS } from '../config.js';
import { formatCannedJobsList, formatShopProfileSummary } from './chatFormatters.js';
import { runGroundedChatCompletion } from './chatSkill.js';
import { promptSection } from './promptLoader.js';

const FILE = 'shop-chat-system';

// The named customer's past visits, one line each ('' when there are none).
function formatCustomerHistoryLines(history) {
  if (!history || history.length === 0) return '';
  return history.map((v) => {
    const date = v.date ? new Date(v.date).toLocaleDateString() : promptSection(FILE, 'date-unknown');
    const services = (v.services || []).join(', ') || promptSection(FILE, 'history-no-items');
    const total = v.totalEstimate ? ` — $${v.totalEstimate}` : '';
    return `  - ${date} (${v.roNumber || 'RO?'}): ${v.serviceType || 'service'} — ${services}${total}`;
  }).join('\n');
}

// The prompt wording lives in prompts/shop-chat-system.md (section "system");
// this only computes the values it renders.
export function buildShopChatSystemPrompt({ shopName, cannedJobs, shopProfile, customerName, customerHistory, customerMatches } = {}) {
  return promptSection(FILE, 'system', {
    shopName:           shopName || '',
    cannedJobsList:     formatCannedJobsList(cannedJobs),
    shopProfileSummary: formatShopProfileSummary(shopProfile),
    customerName:       customerName || '',
    historyLines:       customerName ? formatCustomerHistoryLines(customerHistory) : '',
    multipleMatches:    customerMatches?.length > 1,
    matchNames:         (customerMatches || []).map((c) => c.name).join(', '),
  });
}

/**
 * @param {object} opts
 * @param {string} opts.message
 * @param {Array<{role:'user'|'assistant', text:string}>} [opts.history]
 * @param {string} [opts.shopName]
 * @param {Array}  [opts.cannedJobs]
 * @param {object} [opts.shopProfile]
 * @param {string} [opts.customerName]
 * @param {Array}  [opts.customerHistory]
 * @param {Array}  [opts.customerMatches]
 * @returns {Promise<{reply: string}>}
 */
export async function runShopChatAgent({ message, history = [], shopName, cannedJobs, shopProfile, customerName, customerHistory, customerMatches }) {
  const system = buildShopChatSystemPrompt({ shopName, cannedJobs, shopProfile, customerName, customerHistory, customerMatches });

  // Always the default Predii LLM profile — no frontier tier, no per-request override.
  const reply = await runGroundedChatCompletion({
    system,
    history,
    message,
    maxTokens: RO_CHAT_MAX_TOKENS,
    route: '/api/shop-chat',
    useConfiguredProvider: true,
  });

  return { reply };
}
