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

function formatCustomerHistory(customerName, history) {
  if (!customerName) return null;
  if (!history || history.length === 0) return `${customerName}: no past visits on file`;
  const lines = history.map((v) => {
    const date = v.date ? new Date(v.date).toLocaleDateString() : 'unknown date';
    const services = (v.services || []).join(', ') || 'no line items listed';
    const total = v.totalEstimate ? ` — $${v.totalEstimate}` : '';
    return `  - ${date} (${v.roNumber || 'RO?'}): ${v.serviceType || 'service'} — ${services}${total}`;
  }).join('\n');
  return `${customerName}'s visit history (most recent first):\n${lines}`;
}

export function buildShopChatSystemPrompt({ shopName, cannedJobs, shopProfile, customerName, customerHistory, customerMatches } = {}) {
  const cannedJobsList = formatCannedJobsList(cannedJobs);
  const shopProfileSummary = formatShopProfileSummary(shopProfile);
  const customerHistoryBlock = formatCustomerHistory(customerName, customerHistory);

  const customerNote = customerMatches?.length > 1
    ? `\nNote: "${customerName}" matched more than one customer (${customerMatches.map((c) => c.name).join(', ')}) — the history below is for the first match only. If the advisor needs a different one, ask them to be more specific.`
    : '';

  return `You are the WrenchIQ Assistant, a bilingual (English and Spanish) shop-wide assistant for ${shopName || 'this shop'}. This is a free-form chat at the queue/dashboard level — no specific RO is open. Answer using only the real, shop-owned data below; never invent a price, part, or visit that isn't actually on file.

Shop's canned job menu (labor price + priced parts package per job):
${cannedJobsList}

Shop Profile (Predii Learn's persisted analysis of this shop's history — top repair jobs, top parts, repeat customers, seasonal patterns):
${shopProfileSummary}
${customerHistoryBlock ? `\n${customerHistoryBlock}${customerNote}` : '\nNo customer selected for this question — if the advisor asks about a specific customer, tell them to name the customer (there is a "Customer" field above the message box) so their history can be looked up.'}

Rules:
- Detect the language of the user's message and reply in that same language (English or Spanish).
- Keep replies short and directly usable. Lead with the answer; add at most one short follow-up line only if something needs clarifying.
- When asked for a price, match against the canned job menu above. If nothing is a reasonable match, say plainly it's not on file — never invent a price.
- When asked about shop patterns (repeat customers, seasonal trends, common parts/jobs), answer from the Shop Profile above. If it says "none on file yet," say so plainly.
- When asked about a customer's history, answer only from the customer history block above (if present). If no customer is selected or none was found, say so and ask the advisor to name the customer.
- Stay in scope: this shop's own pricing, patterns, or named-customer history. If asked something genuinely unrelated, briefly redirect back to what you're for.`;
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
