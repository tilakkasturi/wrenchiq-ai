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
