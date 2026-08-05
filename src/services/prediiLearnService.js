/**
 * WrenchIQ — Predii Learn Service
 * Browser client for the /api/predii-learn/* proxy routes (server/routes/prediiLearn.js),
 * which forward to the separate ro-ner-demo service.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/predii-learn/health`);
  if (!res.ok) throw new Error(`Predii Learn service unreachable (${res.status})`);
  return res.json();
}

export async function fetchShopProfile({ years } = {}) {
  const url = new URL(`${API_BASE}/api/predii-learn/shop-profile`, window.location.origin);
  if (years) url.searchParams.set("years", years);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Predii Learn shop profile failed (${res.status})`);
  return res.json();
}

// V5 feedback (A1): the shop's canned-job menu — real MongoDB data seeded by
// scripts/seedCannedJobsCornerstone.js, not derived from the live NER run.
export async function fetchCannedJobs(shopId) {
  const res = await fetch(`${API_BASE}/api/canned-jobs/${shopId}`);
  if (!res.ok) throw new Error(`Canned jobs fetch failed (${res.status})`);
  return res.json();
}

// V5 feedback follow-up: persist whatever the Shop Profile tab is currently
// showing (live-run results or the static fallback — both already
// normalized to the same shape) so RO Chat can ground answers in it without
// needing a fresh "Run Predii Learn" pass every time.
export async function persistShopProfile(shopId, profile) {
  const res = await fetch(`${API_BASE}/api/shop-profile-snapshot/${shopId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) throw new Error(`Persist shop profile failed (${res.status})`);
  return res.json();
}

export async function fetchPersistedShopProfile(shopId) {
  const res = await fetch(`${API_BASE}/api/shop-profile-snapshot/${shopId}`);
  if (!res.ok) throw new Error(`Fetch persisted shop profile failed (${res.status})`);
  return res.json();
}

/**
 * Kicks off a batch NER run and streams results back via SSE.
 * EventSource can't be used since the request needs a POST body, so the
 * streaming body is read and parsed by hand.
 *
 * @param {object} opts
 * @param {number} opts.years
 * @param {number} [opts.n]
 * @param {(event: {progress:number, completed:number, total:number, result:object}) => void} opts.onEvent
 * @param {AbortSignal} [opts.signal]
 */
export async function runBatch({ years, n = 20, onEvent, signal }) {
  const res = await fetch(`${API_BASE}/api/predii-learn/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ years, n }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Predii Learn run failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        onEvent?.(JSON.parse(payload));
      } catch (err) {
        console.warn("[prediiLearnService] failed to parse SSE chunk:", err);
      }
    }
  }
}
