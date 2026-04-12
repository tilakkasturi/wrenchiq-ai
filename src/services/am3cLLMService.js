/**
 * am3cLLMService.js
 * Calls Claude to generate Short / Verbose / AI-Rewrite 3C narratives.
 * Falls back to local text transformations when VITE_ANTHROPIC_API_KEY is not set.
 */

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

// ── Prompts ───────────────────────────────────────────────────

const SYSTEM_SHORT = `You are an automotive repair documentation assistant.
Rewrite the 3C (Complaint, Cause, Correction) narrative in SHORT, concise technical language.
Each section must be 1–2 sentences maximum. Use precise automotive terminology.
Avoid filler words. Return valid JSON only: { "complaint": "...", "cause": "...", "correction": "..." }`;

const SYSTEM_VERBOSE = `You are an automotive repair communication specialist who writes for customers, not technicians.
Rewrite the 3C narrative in VERBOSE, customer-friendly language that:
- Avoids jargon — explain any technical terms in plain English
- Sounds warm, professional, and reassuring
- Explains WHY things happened, not just what was found
- Uses "your vehicle", "we found", "we repaired" framing
- Is 3–5 sentences per section
Return valid JSON only: { "complaint": "...", "cause": "...", "correction": "..." }`;

const SYSTEM_REWRITE = `You are an expert automotive service writer with 20 years of experience.
Given the raw 3C data, write a PROFESSIONAL, complete narrative that:
- Is accurate and technically precise
- Flows naturally as connected prose
- Includes all relevant findings (DTCs, TSBs, DVI items, tech notes)
- Meets OEM and insurance documentation standards
- Complaint: 2 sentences, Cause: 3–4 sentences (cite specific findings), Correction: 2–3 sentences
Return valid JSON only: { "complaint": "...", "cause": "...", "correction": "..." }`;

// ── Build the user message ────────────────────────────────────

function buildUserMessage({ complaint, cause, correction, vehicle, roId, dviFindings, tsbMatches, dtcCodes, techNotes }) {
  const vehicleStr = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""} (VIN: ${vehicle.vin || "N/A"})`
    : "Unknown vehicle";

  const dtcStr = (dtcCodes || []).map(d => `${d.code || d}: ${d.description || ""}`).join("; ") || "None";
  const tsbStr = (tsbMatches || []).filter(t => t.accepted).map(t => `${t.id || ""}: ${t.title || t.summary || ""}`).join("; ") || "None";
  const dviStr = (dviFindings || []).filter(f => f.severity === "red" || f.status === "red")
    .map(f => f.finding || f.text || "").join("; ") || "None";

  return `RO: ${roId || "N/A"}
Vehicle: ${vehicleStr}

Current 3C:
COMPLAINT: ${complaint || "(empty)"}
CAUSE: ${cause || "(empty)"}
CORRECTION: ${correction || "(empty)"}

Supporting findings:
- DTCs: ${dtcStr}
- TSBs: ${tsbStr}
- DVI red items: ${dviStr}
- Tech notes: ${techNotes || "None"}

Rewrite the 3C narrative per the instructions. Return JSON only.`;
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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Short and Verbose can work without the API
  if (mode === "short" && !apiKey) {
    return { ...localShort(context), usedLLM: false };
  }
  if (mode === "verbose" && !apiKey) {
    return { ...localVerbose(context), usedLLM: false };
  }
  if (!apiKey) {
    // LLM mode requested but no key — fall back to verbose
    return { ...localVerbose(context), usedLLM: false, fallback: true };
  }

  const systemPrompt =
    mode === "short"   ? SYSTEM_SHORT   :
    mode === "verbose" ? SYSTEM_VERBOSE :
                         SYSTEM_REWRITE;

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-allow-browser": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: buildUserMessage(context) }],
      }),
    });
  } catch (networkErr) {
    console.error("Claude API network error:", networkErr);
    // CORS or network failure — fall back to local
    const fallback = mode === "short" ? localShort(context) : localVerbose(context);
    return { ...fallback, usedLLM: false, fallback: true, error: networkErr.message };
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error("Claude API HTTP error:", res.status, errText);
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text || "{}";
  console.log("Claude raw response:", raw);

  // Extract JSON from the response (handle markdown code fences)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned non-JSON: " + raw.slice(0, 200));
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    complaint:  parsed.complaint  || context.complaint  || "",
    cause:      parsed.cause      || context.cause      || "",
    correction: parsed.correction || context.correction || "",
    usedLLM: true,
  };
}
