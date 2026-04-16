/**
 * WrenchIQ — Server Configuration
 *
 * All deployment-specific settings live here.
 * Values are read from environment variables with sensible defaults.
 * Copy .env.example → .env.local and set your values before starting the server.
 */

// ── Azure OpenAI ──────────────────────────────────────────────────────────────
export const AZURE_OPENAI_API_KEY =
  process.env.AZURE_OPENAI_API_KEY || '';

export const AZURE_OPENAI_API_BASE =
  process.env.AZURE_OPENAI_API_BASE || 'https://prediillm2.openai.azure.com/openai/v1/';

export const AZURE_OPENAI_API_VERSION =
  process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

export const AZURE_OPENAI_MODEL =
  process.env.AZURE_OPENAI_MODEL || 'gpt-4o-mini';

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
