// V5 feedback (E2): client-side-only gating of financial widgets
// (revenue, margin, ARO, ELR) from every persona except owner/manager
// equivalents. No server-side enforcement exists for this — it's a UI
// convenience matching the demo's existing trust model, not a security
// boundary (see WrenchIQ V5 Feedback & Implementation Plan, Confluence).
const FINANCIAL_VIEW_PERSONAS = new Set(["owner", "fixedOps"]);

export function canViewFinancials(persona) {
  return FINANCIAL_VIEW_PERSONAS.has(persona);
}

export default function useCanViewFinancials(persona) {
  return canViewFinancials(persona);
}
