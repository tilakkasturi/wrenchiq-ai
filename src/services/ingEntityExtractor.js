/**
 * ingEntityExtractor — LLM-based entity extraction for shop ings
 *
 * Sends free-text ings to the configured LLM (self-hosted Qwen by default,
 * falling back to direct Anthropic Claude — see priority list below) in a
 * single batch call and returns
 * structured entity data for each:
 *   { promotionType, conditions, action, discount, displayLabel }
 *
 * Results are cached in localStorage so each unique ing text is only
 * processed once. No hardcoded trigger logic — the LLM owns the parsing.
 *
 * A single-call extraction skill, not an agent — the 3-level fallback chain
 * is transport failover, not decision-making. See
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md.
 */

import { prompt } from "./promptLoader";

// ── LLM endpoint config ───────────────────────────────────────────────────────
// Priority:
//   1. VITE_LLM_BASE_URL (local/custom OpenAI-compatible server) — direct call
//   2. VITE_ANTHROPIC_API_KEY — direct Anthropic call
//   3. Server proxy /api/claude/messages (uses LLM_BASE_URL from .env.local)

const LLM_BASE_URL   = import.meta.env.VITE_LLM_BASE_URL;   // e.g. http://192.222.55.177:8081
const LLM_API_KEY    = import.meta.env.VITE_LLM_API_KEY || "";
const LLM_MODEL      = import.meta.env.VITE_LLM_MODEL || "gpt-4o-mini";

const ANTHROPIC_KEY  = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const PROXY_URL      = `${import.meta.env.VITE_API_BASE || ""}/api/claude/messages`;

const CACHE_KEY = "wrenchiq_ing_entity_cache_v1";

// ── localStorage cache ────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

// Cache key: stable hash of the note text so renamed ings get re-extracted
function cacheKey(ing) {
  return ing._id && !ing._id.startsWith("fallback-") ? ing._id : ing.note;
}

// ── LLM call ─────────────────────────────────────────────────────────────────

// Wording lives in prompts/ing-entity-extract-system.md and ing-entity-extract-user.md.
const SYSTEM = prompt("ing-entity-extract-system");

function buildPrompt(ings) {
  const list = ings.map(ing => `{"id":${JSON.stringify(cacheKey(ing))},"note":${JSON.stringify(ing.note)}}`).join("\n");
  return prompt("ing-entity-extract-user", { list });
}

async function callLLM(userMessage) {
  // ── 1. Local / custom OpenAI-compatible endpoint (highest priority) ────────
  if (LLM_BASE_URL) {
    const base = LLM_BASE_URL.replace(/\/$/, "");
    const url  = `${base}/v1/chat/completions`;
    const headers = { "content-type": "application/json" };
    if (LLM_API_KEY) headers["Authorization"] = `Bearer ${LLM_API_KEY}`;

    const oaiBody = {
      model:      LLM_MODEL,
      max_tokens: 1024,
      messages:   [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage }],
    };

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(oaiBody) });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "[]";
  }

  // ── 2. Direct Anthropic API (browser key) ─────────────────────────────────
  if (ANTHROPIC_KEY) {
    const body = { model: ANTHROPIC_MODEL, max_tokens: 1024, system: SYSTEM, messages: [{ role: "user", content: userMessage }] };
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text || "[]";
  }

  // ── 3. Server proxy (uses LLM_BASE_URL from .env.local on the server) ─────
  const body = { model: ANTHROPIC_MODEL, max_tokens: 1024, system: SYSTEM, messages: [{ role: "user", content: userMessage }] };
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Proxy ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text || "[]";
}

function parseResults(raw) {
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enrich a list of ings with LLM-extracted entityData.
 * Only calls the LLM for ings not already in the localStorage cache.
 * Returns the same ings array with entityData merged in.
 */
export async function extractIngEntities(ings) {
  if (!ings || ings.length === 0) return ings;

  const cache = loadCache();
  const needExtraction = ings.filter(ing => !cache[cacheKey(ing)]);

  if (needExtraction.length > 0) {
    try {
      const raw     = await callLLM(buildPrompt(needExtraction));
      const results = parseResults(raw);

      results.forEach(r => {
        // Find the ing this result belongs to (matched by id = cacheKey)
        const ing = needExtraction.find(i => cacheKey(i) === r.id);
        if (ing) {
          cache[cacheKey(ing)] = {
            promotionType: r.promotionType || "generic",
            conditions:    r.conditions    || {},
            action:        r.action        || ing.note,
            discount:      r.discount      || null,
            displayLabel:  r.displayLabel  || "Any Vehicle",
          };
        }
      });

      saveCache(cache);
    } catch (err) {
      console.warn("[ingEntityExtractor] LLM call failed:", err.message);
    }
  }

  return ings.map(ing => ({
    ...ing,
    entityData: cache[cacheKey(ing)] || ing.entityData || null,
  }));
}

/**
 * Given a selected RO (with _vehicle), return only the ings that are
 * relevant to it based on their entityData conditions.
 * Falls back to showing all active ings if entityData is missing.
 */
export function filterIngsByRO(ings, selectedRO) {
  if (!selectedRO || !ings) return ings;

  const vehicle = selectedRO._vehicle || null;
  const make    = vehicle?.make?.toLowerCase() || "";
  const model   = vehicle?.model?.toLowerCase() || "";
  const mileage = vehicle?.mileage || 0;

  return ings.filter(ing => {
    if (!ing.active) return false;
    const ed = ing.entityData;
    if (!ed) return true; // no entity data yet — show it

    const c = ed.conditions || {};

    if (c.vehicleMake  && make    && !make.includes(c.vehicleMake.toLowerCase()))  return false;
    if (c.vehicleModel && model   && !model.includes(c.vehicleModel.toLowerCase())) return false;
    if (c.mileageMin   && mileage && mileage < c.mileageMin)  return false;
    if (c.mileageMax   && mileage && mileage > c.mileageMax)  return false;

    return true;
  });
}
