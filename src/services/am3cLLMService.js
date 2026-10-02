/**
 * am3cLLMService.js
 * Calls the configured LLM (proxied server-side via /api/claude/messages,
 * which uses LLM_BASE_URL / LLM_MODEL from server/config.js) to generate
 * Short / Verbose / AI-Rewrite 3C narratives.
 * Falls back to local text transformations when the proxy is unavailable.
 */

import { prompt, promptSection } from "./promptLoader";

// This model name is sent in the request body but ignored by the proxy —
// the proxy always uses the server-configured LLM_MODEL.
const MODEL = "gpt-4o-mini";
const API_BASE = import.meta.env.VITE_API_BASE || "";
const PROXY_URL = `${API_BASE}/api/claude/messages`;

// ── Prompts ───────────────────────────────────────────────────
// Wording lives in prompts/am3c-narrative-*.md; this only computes the data.

const SYSTEM_PROMPT = {
  short:   "am3c-narrative-short-system",
  verbose: "am3c-narrative-verbose-system",
};

// ── Build the user message ────────────────────────────────────

function buildUserMessage({ complaint, cause, correction, vehicle, roId, dviFindings, tsbMatches, dtcCodes, techNotes, laborLines, parts }) {
  const vehicleName = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`
    : "";

  const dtcs = (dtcCodes || []).map(d => `${d.code || d}: ${d.description || ""}`).join("; ");
  const tsbs = (tsbMatches || [])
    .filter(t => t.accepted !== false)
    .map(t => `${t.id || t.tsbId || ""}: ${t.title || t.summary || ""}`)
    .join("\n  ");
  const dviRed = (dviFindings || []).filter(f => f.severity === "red" || f.status === "red")
    .map(f => f.finding || f.text || "").join("; ");

  const laborStr = (laborLines || []).map(l =>
    "  " + promptSection("am3c-narrative-rows", "labor", { description: l.description || l.name || "" })
  ).join("\n");

  const partLines = (parts || []).map(p =>
    "  " + promptSection("am3c-narrative-rows", "part", { description: p.description || p.name || "", partNumber: p.partNumber || p.partNum || "", qty: String(p.qty ?? 1) })
  ).join("\n");

  return prompt("am3c-narrative-user", {
    roId, vehicleName, vin: vehicle?.vin, complaint, cause, correction,
    milOn: (dtcCodes || []).length > 0, dtcs, tsbs, dviRed, techNotes,
    laborLines: laborStr, partLines,
  });
}

// ── Local fallbacks (no API key) ──────────────────────────────

function localShort({ complaint, cause, correction }) {
  const firstSentence = str => (str || "").split(/[.!?]/)[0].trim() + ".";
  return {
    complaint: firstSentence(complaint) || "Customer reported concern.",
    cause: firstSentence(cause) || "Root cause identified during inspection.",
    correction: firstSentence(correction) || "Repair performed per manufacturer specification.",
  };
}

function localVerbose({ complaint, cause, correction, vehicle }) {
  const veh = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "your vehicle";
  return {
    complaint: `Your ${veh} was brought in because ${(complaint || "of a reported concern").toLowerCase().replace(/^customer (states?|reports?|complains?) (that )?/i, "")}. We took note of your concern and performed a thorough inspection to identify the underlying issue.`,
    cause: `After a comprehensive diagnostic evaluation, our technicians determined that ${(cause || "the issue was identified").toLowerCase()}. This type of issue can develop over time and, if left unaddressed, may lead to additional wear or related problems. We documented all findings to support a complete and accurate repair.`,
    correction: `To resolve this concern, ${(correction || "the necessary repairs were completed").toLowerCase()}. All work was performed in accordance with manufacturer specifications and industry best practices. Your vehicle has been tested and confirmed to be operating correctly.`,
  };
}

// ── Main export ───────────────────────────────────────────────

/**
 * @param {'short'|'verbose'|'llm'} mode
 * @param {object} context - { complaint, cause, correction, vehicle, roId, dviFindings, tsbMatches, dtcCodes, techNotes }
 * @returns {Promise<{ complaint: string, cause: string, correction: string, usedLLM: boolean }>}
 */
export async function generateNarrative(mode, context) {
  const systemPrompt = prompt(SYSTEM_PROMPT[mode] || "am3c-narrative-rewrite-system");

  const body = JSON.stringify({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: buildUserMessage(context) }],
  });

  let res;
  try {
    // Server proxy translates to Azure OpenAI — no browser API key needed
    res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    // Proxy unavailable — fall back to local transformations
    if (res.status === 503) {
      console.warn("[am3cLLM] Server proxy unavailable, using local fallback");
      const fallback = mode === "short" ? localShort(context) : localVerbose(context);
      return { ...fallback, usedLLM: false, fallback: true };
    }
  } catch (networkErr) {
    console.error("Azure proxy network error:", networkErr);
    const fallback = mode === "short" ? localShort(context) : localVerbose(context);
    return { ...fallback, usedLLM: false, fallback: true, error: networkErr.message };
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error("Azure proxy HTTP error:", res.status, errText);
    throw new Error(`Azure proxy ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text || "{}";
  console.log("Azure raw response:", raw);

  // Extract JSON from the response (handle markdown code fences)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("LLM returned non-JSON: " + raw.slice(0, 200));
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    complaint:  parsed.complaint  || context.complaint  || "",
    cause:      parsed.cause      || context.cause      || "",
    correction: parsed.correction || context.correction || "",
    usedLLM: true,
  };
}
