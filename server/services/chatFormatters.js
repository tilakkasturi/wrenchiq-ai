/**
 * WrenchIQ — Shared Chat Grounding Formatters
 *
 * Was duplicated verbatim in shopChatService.js and roChatService.js — both
 * chat skills ground on the same shop-owned canned-job menu and persisted
 * Predii Learn Shop Profile, so the formatting is genuinely identical, not
 * just similar. Extracted here to fix that (see
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md).
 *
 * The wording (fallback phrases, line layouts) lives in the sectioned
 * prompts/chat-grounding.md; this file only computes the values.
 *
 * `formatCustomerHistory` is intentionally NOT here — the two services'
 * versions differ in signature and fallback text, so folding them would
 * change behavior in one service rather than just removing duplication.
 */
import { promptSection } from './promptLoader.js';

const FILE = 'chat-grounding';
const str = (v) => String(v);

export function formatCannedJobsList(cannedJobs) {
  if (!cannedJobs || cannedJobs.length === 0) return promptSection(FILE, 'canned-jobs-none');
  return cannedJobs.map((j) => promptSection(FILE, 'canned-job', {
    description: str(j.description),
    category:    j.category ? str(j.category) : '',
    laborCost:   str(j.laborCost),
    laborHours:  str(j.laborHours),
    parts:       (j.parts || []).map((p) => `${p.description} $${p.lineCost}`).join(', '),
    total:       str(j.totalPrice ?? ((j.laborCost || 0) + (j.parts || []).reduce((s, p) => s + (p.lineCost || 0), 0))),
  })).join('\n');
}

// Shop Profile — the shop's persisted Predii Learn snapshot (see
// shopProfileSnapshotService.js): repeat-customer history, top parts,
// seasonal patterns. Persisted once (via the "Persist Shop Profile" button
// on the Predii Learn screen) so chat can ground answers in it without
// requiring a fresh "Run Predii Learn" pass every time. Summarized to the
// top 5 of each list to keep the prompt from ballooning.
export function formatShopProfileSummary(profile) {
  if (!profile) return promptSection(FILE, 'shop-profile-none');

  const top5 = (list) => (list || []).slice(0, 5);
  const jobs = top5(profile.top_repair_jobs).map((j) => `${j.job} (${j.count}x)`).join(', ');
  const parts = top5(profile.top_parts)
    .map((p) => promptSection(FILE, 'shop-profile-part', {
      name:     str(p.name),
      hasPrice: p.avg_price != null,
      price:    str(p.avg_price),
      supplier: p.preferred_supplier ? str(p.preferred_supplier) : '',
    }))
    .join(', ');
  const customers = top5(profile.top_repeat_customers)
    .map((c) => promptSection(FILE, 'shop-profile-customer', {
      name:   str(c.name),
      visits: str(c.visit_count),
      since:  str(c.customer_since || '?'),
      spend:  str(c.lifetime_spend),
    }))
    .join(', ');
  const seasonal = (profile.seasonal_profile || [])
    .map((s) => promptSection(FILE, 'shop-profile-season', {
      name:   str(s.name),
      range:  str(s.range),
      topJob: s.top_repair_jobs?.[0]?.job ? str(s.top_repair_jobs[0].job) : '',
      focus:  s.recommended_focus?.length ? s.recommended_focus.map((f) => `${f.name} ${f.index}x`).join(', ') : '',
    }))
    .join('; ');

  const o = profile.overall || {};
  return promptSection(FILE, 'shop-profile', {
    roCount:       str(o.ro_count ?? '?'),
    customerCount: str(o.customer_count ?? '?'),
    avgRoValue:    str(o.avg_ro_value ?? '?'),
    marginPct:     str(o.overall_margin_pct ?? '?'),
    jobs, parts, customers, seasonal,
  });
}
