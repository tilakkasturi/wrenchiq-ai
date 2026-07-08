/**
 * am3cLLMService.js
 * Calls the configured LLM (proxied server-side via /api/claude/messages,
 * which uses LLM_BASE_URL / LLM_MODEL from server/config.js) to generate
 * Short / Verbose / AI-Rewrite 3C narratives.
 * Falls back to local text transformations when the proxy is unavailable.
 */

// This model name is sent in the request body but ignored by the proxy —
// the proxy always uses the server-configured LLM_MODEL.
const MODEL = "gpt-4o-mini";
const API_BASE = import.meta.env.VITE_API_BASE || "";
const PROXY_URL = `${API_BASE}/api/claude/messages`;

// ── Prompts ───────────────────────────────────────────────────

const SYSTEM_SHORT = `You are an automotive repair documentation assistant.
Rewrite the 3C (Complaint, Cause, Correction) narrative in SHORT, concise technical language.
Rules:
- Each section: 1–2 sentences maximum
- Cause MUST cite every DTC by code (e.g. P0420) and tie it to the TSB number if provided
- If a check engine light / MIL is on, say so explicitly in Cause
- Correction MUST name each part installed with part number and quantity — no labor hours
- Use precise automotive terminology, no filler words
Return valid JSON only: { "complaint": "...", "cause": "...", "correction": "..." }`;

const SYSTEM_VERBOSE = `You are an automotive repair communication specialist who writes for customers, not technicians.
Rewrite the 3C narrative in VERBOSE, customer-friendly language that:
- Avoids jargon — explain any technical terms in plain English
- Sounds warm, professional, and reassuring
- Explains WHY things happened, not just what was found
- Uses "your vehicle", "we found", "we repaired" framing
- Is 3–5 sentences per section
- Cause: if a check engine light is on, explain what it means in plain English; mention the code briefly
- Correction: describe each repair performed including parts replaced (plain name, no raw part numbers needed)
Return valid JSON only: { "complaint": "...", "cause": "...", "correction": "..." }`;

const SYSTEM_REWRITE = `You are an expert automotive service writer with 20 years of experience.
Given the raw 3C data, write a PROFESSIONAL, complete narrative that meets OEM and insurance documentation standards.

COMPLAINT (2 sentences):
- Document customer's exact concern with onset, frequency, and conditions

CAUSE (3–5 sentences):
- State whether a diagnostic scan was performed and list every DTC found (code + short description)
- If DTCs are present and the check engine / MIL light is on, state that explicitly
- Cite the specific TSB number and full title for any applicable technical service bulletin
- Tie each DTC directly to the TSB it matches
- Include test results (pressure readings, voltage measurements, live data observations)

CORRECTION (4–6 sentences, two logical sections — do NOT mention labor hours):
SECTION A — Work Performed (based on approved estimate):
- List every part replaced or installed: description, OEM part number, and quantity (e.g. "Upstream O2 Sensor, P/N 89467-06170, qty 1")
- If no parts were installed (diagnostic only), state what diagnostic procedures were completed
- State test/verification performed after completed work (road test miles, monitor status, recheck result)
SECTION B — Work Recommended (based on inspection findings):
- If additional repair was identified but is pending customer authorization, list the recommended parts (name + part number + qty)
- Do NOT include labor hours — parts only
- Phrase as: "Based on inspection, recommend: [repair description] — [part name, P/N, qty]. Pending customer authorization."

Return valid JSON only: { "complaint": "...", "cause": "...", "correction": "..." }`;

// ── Build the user message ────────────────────────────────────

function buildUserMessage({ complaint, cause, correction, vehicle, roId, dviFindings, tsbMatches, dtcCodes, techNotes, laborLines, parts }) {
  const vehicleStr = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""} (VIN: ${vehicle.vin || "N/A"})`
    : "Unknown vehicle";

  const dtcStr = (dtcCodes || []).map(d => `${d.code || d}: ${d.description || ""}`).join("; ") || "None";
  const milOn  = (dtcCodes || []).length > 0 ? "YES — MIL/CEL illuminated" : "No active DTCs — MIL off";
  const tsbStr = (tsbMatches || [])
    .filter(t => t.accepted !== false)
    .map(t => `${t.id || t.tsbId || ""}: ${t.title || t.summary || ""}`)
    .join("\n  ") || "None";
  const dviStr = (dviFindings || []).filter(f => f.severity === "red" || f.status === "red")
    .map(f => f.finding || f.text || "").join("; ") || "None";

  const laborStr = (laborLines || []).map(l =>
    `  - ${l.description || l.name || ""}`
  ).join("\n") || "  None provided";

  const partsStr = (parts || []).map(p =>
    `  - ${p.description || p.name || ""} | P/N: ${p.partNumber || p.partNum || "N/A"} | Qty: ${p.qty ?? 1}`
  ).join("\n") || "  None provided";

  return `RO: ${roId || "N/A"}
Vehicle: ${vehicleStr}

Current 3C (raw — rewrite this):
COMPLAINT: ${complaint || "(empty)"}
CAUSE: ${cause || "(empty)"}
CORRECTION: ${correction || "(empty)"}

Diagnostic findings:
- Check Engine Light / MIL: ${milOn}
- DTCs scanned: ${dtcStr}
- Applicable TSBs:
  ${tsbStr}
- DVI red items: ${dviStr}
- Tech notes: ${techNotes || "None"}

Work performed (procedures completed):
${laborStr}

Parts installed/recommended (include in Correction with part numbers — no labor hours):
${partsStr}

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
  const systemPrompt =
    mode === "short"   ? SYSTEM_SHORT   :
    mode === "verbose" ? SYSTEM_VERBOSE :
                         SYSTEM_REWRITE;

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
