// Client for the repair order agent (server/routes/coreAgent.js). The model runs server-side; the browser
// sends the conversation and runs the tools itself.
const API_BASE = import.meta.env.VITE_API_BASE || '';

/** One model step for the repair order agent. @returns {Promise<{ok:true, message:{content:string, tool_calls:object[]}, model:string} | {ok:false, message:string}>} */
export async function agentStep({ messages, context, tools, trace }) {
  try {
    const res = await fetch(`${API_BASE}/api/core/agent/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, tools, trace }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: body.message || 'The assistant could not answer just now.' };
    return { ok: true, ...body };
  } catch (_) {
    return { ok: false, message: 'Could not reach the WrenchIQ server, so the assistant is offline.' };
  }
}
