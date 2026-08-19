/**
 * WrenchIQ — Shared Chat Grounding Formatters
 *
 * Was duplicated verbatim in shopChatService.js and roChatService.js — both
 * chat skills ground on the same shop-owned canned-job menu and persisted
 * Predii Learn Shop Profile, so the formatting is genuinely identical, not
 * just similar. Extracted here to fix that (see
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md).
 *
 * `formatCustomerHistory` is intentionally NOT here — the two services'
 * versions differ in signature and fallback text, so folding them would
 * change behavior in one service rather than just removing duplication.
 */

export function formatCannedJobsList(cannedJobs) {
  if (!cannedJobs || cannedJobs.length === 0) return 'none on file';
  return cannedJobs.map((j) => {
    const parts = (j.parts || []).map((p) => `${p.description} $${p.lineCost}`).join(', ') || 'no parts';
    const total = j.totalPrice ?? ((j.laborCost || 0) + (j.parts || []).reduce((s, p) => s + (p.lineCost || 0), 0));
    return `- ${j.description} (${j.category || 'uncategorized'}): labor $${j.laborCost} (${j.laborHours} hrs) + parts [${parts}] = $${total} total`;
  }).join('\n');
}

// Shop Profile — the shop's persisted Predii Learn snapshot (see
// shopProfileSnapshotService.js): repeat-customer history, top parts,
// seasonal patterns. Persisted once (via the "Persist Shop Profile" button
// on the Predii Learn screen) so chat can ground answers in it without
// requiring a fresh "Run Predii Learn" pass every time. Summarized to the
// top 5 of each list to keep the prompt from ballooning.
export function formatShopProfileSummary(profile) {
  if (!profile) return 'none on file yet — no Shop Profile has been persisted for this shop (Settings → Predii Learn → Shop Profile → Persist Shop Profile)';

  const top5 = (list) => (list || []).slice(0, 5);
  const jobs = top5(profile.top_repair_jobs).map((j) => `${j.job} (${j.count}x)`).join(', ') || 'none';
  const parts = top5(profile.top_parts)
    .map((p) => `${p.name}${p.avg_price != null ? ` ~$${p.avg_price}` : ''}${p.preferred_supplier ? ` via ${p.preferred_supplier}` : ''}`)
    .join(', ') || 'none';
  const customers = top5(profile.top_repeat_customers)
    .map((c) => `${c.name} (${c.visit_count} visits, customer since ${c.customer_since || '?'}, $${c.lifetime_spend} lifetime)`)
    .join(', ') || 'none';
  const seasonal = (profile.seasonal_profile || [])
    .map((s) => `${s.name} (${s.range}): top job ${s.top_repair_jobs?.[0]?.job || 'n/a'}${s.recommended_focus?.length ? `, focus: ${s.recommended_focus.map((f) => `${f.name} ${f.index}x`).join(', ')}` : ''}`)
    .join('; ') || 'none';

  const o = profile.overall || {};
  return `Overall: ${o.ro_count ?? '?'} ROs, ${o.customer_count ?? '?'} customers, avg RO value $${o.avg_ro_value ?? '?'}, margin ${o.overall_margin_pct ?? '?'}%.
Top repair jobs: ${jobs}
Top parts: ${parts}
Top repeat customers: ${customers}
Seasonal patterns: ${seasonal}`;
}
