/**
 * WrenchIQ — Server Configuration
 *
 * All deployment-specific settings live here.
 * Values are read from environment variables with sensible defaults.
 * Copy .env.example → .env.local and set your values before starting the server.
 */

// ── LLM endpoint (generic — works with any OpenAI-compatible server) ──────────
// LLM_BASE_URL takes priority over the Azure-specific vars below.
// Examples:
//   Local:  LLM_BASE_URL=http://192.222.55.177:8081/v1
//   Azure:  LLM_BASE_URL=https://prediillm2.openai.azure.com/openai/v1
export const LLM_BASE_URL =
  process.env.LLM_BASE_URL || process.env.AZURE_OPENAI_API_BASE || 'https://prediillm2.openai.azure.com/openai/v1/';

// API key — leave blank for local servers that don't require auth
export const LLM_API_KEY =
  process.env.LLM_API_KEY || process.env.AZURE_OPENAI_API_KEY || '';

// Model name — sent in every completion request
export const LLM_MODEL =
  process.env.LLM_MODEL || process.env.AZURE_OPENAI_MODEL || 'gpt-4o-mini';

// Set LLM_SKIP_TOOLS=true when the LLM server doesn't support tool_calls
// (e.g. vLLM without --enable-auto-tool-choice --tool-call-parser hermes)
export const LLM_SKIP_TOOLS =
  process.env.LLM_SKIP_TOOLS === 'true' || process.env.LLM_SKIP_TOOLS === '1';

// ── Azure OpenAI (legacy aliases — kept for any remaining imports) ─────────────
export const AZURE_OPENAI_API_KEY = LLM_API_KEY;
export const AZURE_OPENAI_API_BASE = LLM_BASE_URL;
export const AZURE_OPENAI_API_VERSION =
  process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
export const AZURE_OPENAI_MODEL = LLM_MODEL;

// Raw Azure OpenAI env values, kept distinct from the LLM_BASE_URL/LLM_MODEL
// exports above (the legacy aliases just mirror whichever provider currently
// wins LLM_BASE_URL's priority order — not necessarily Azure). Used by
// llmProviderConfig.js so Azure remains selectable as its own profile even
// when LLM_BASE_URL is pointed at a different provider.
export const RAW_AZURE_BASE_URL = process.env.AZURE_OPENAI_API_BASE || '';
export const RAW_AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
export const RAW_AZURE_MODEL = process.env.AZURE_OPENAI_MODEL || '';

// V5 feedback (D3): optional frontier-model tier (e.g. GPT-5.5), offered as
// a per-request toggle alongside the default "Predii LLM" model. This is a
// genuinely separate endpoint/deployment (a shop's own Azure Foundry
// resource), not just a different model name on whichever endpoint the
// Settings → Integrations "AI Engine" toggle already points at — so it
// needs its own base URL + key, not only a model override. Falls back to
// the general AZURE_OPENAI_* vars (RAW_AZURE_*) when the frontier-specific
// ones aren't set, since that's where a shop's real Azure resource usually
// gets configured first. All unset means the tier is simply not configured
// yet (see isProfileConfigured in llmProviderConfig.js) — the toggle then
// falls back to Predii LLM rather than silently resending the same model
// to the wrong endpoint.
export const FRONTIER_BASE_URL = process.env.AZURE_OPENAI_FRONTIER_BASE_URL || RAW_AZURE_BASE_URL;
export const FRONTIER_API_KEY  = process.env.AZURE_OPENAI_FRONTIER_API_KEY  || RAW_AZURE_API_KEY;
export const FRONTIER_MODEL    =
  process.env.AZURE_OPENAI_FRONTIER_MODEL || process.env.AZURE_OPENAI_FRONTIER_DEPLOYMENT || RAW_AZURE_MODEL;
export const FRONTIER_API_VERSION =
  process.env.AZURE_OPENAI_FRONTIER_API_VERSION || AZURE_OPENAI_API_VERSION;

// RO Chat's completion-token budget — configurable via env since reasoning
// models (gpt-5.x) spend part of it on hidden reasoning before writing any
// visible reply, so a complex multi-step prompt needs more headroom than a
// simple rewrite. The Tauri chat UI can override this per-request for
// complex tasks (clamped server-side — see roChatService.js).
export const RO_CHAT_MAX_TOKENS =
  parseInt(process.env.LLM_MAX_TOKENS || '2000', 10);

// Token budgets
export const CLAUDE_MAX_TOKENS_CHAT =
  parseInt(process.env.CLAUDE_MAX_TOKENS_CHAT || '800', 10);

export const CLAUDE_MAX_TOKENS_RECOMMENDATIONS =
  parseInt(process.env.CLAUDE_MAX_TOKENS_RECOMMENDATIONS || '2048', 10);

// Legacy aliases — kept so any remaining imports don't break
export const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';
export const CLAUDE_MODEL_CHAT = AZURE_OPENAI_MODEL;
export const CLAUDE_MODEL_RECOMMENDATIONS = AZURE_OPENAI_MODEL;
export const CLAUDE_MODEL_AGENT = AZURE_OPENAI_MODEL;

// ── MongoDB ───────────────────────────────────────────────────────────────────
export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017';

export const MONGODB_DB =
  process.env.MONGODB_DB || 'wrenchiq';

// ── API Server ────────────────────────────────────────────────────────────────
export const API_PORT =
  parseInt(process.env.API_PORT || '3001', 10);

// ── Predii Learn (ro-ner-demo) ─────────────────────────────────────────────────
// Base URL of the ro-ner-demo FastAPI service (assumed already running).
export const RO_NER_BASE_URL =
  process.env.RO_NER_BASE_URL || 'http://localhost:8090';
