/**
 * WrenchIQ — Server Configuration
 *
 * All deployment-specific settings live here.
 * Values are read from environment variables with sensible defaults.
 * Copy .env.example → .env.local and set your values before starting the server.
 */

// ── Claude / Anthropic ────────────────────────────────────────────────────────
export const CLAUDE_API_KEY =
  process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || '';

export const CLAUDE_API_URL =
  process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

export const CLAUDE_API_VERSION =
  process.env.CLAUDE_API_VERSION || '2023-06-01';

// Model used for Knowledge Graph chat (fast, low-cost)
export const CLAUDE_MODEL_CHAT =
  process.env.CLAUDE_MODEL_CHAT || 'claude-haiku-4-5-20251001';

// Model used for Recommendations engine (same default, override for higher quality)
export const CLAUDE_MODEL_RECOMMENDATIONS =
  process.env.CLAUDE_MODEL_RECOMMENDATIONS || 'claude-haiku-4-5-20251001';

// Model used for Managed Agents (more capable model for agentic tasks)
export const CLAUDE_MODEL_AGENT =
  process.env.CLAUDE_MODEL_AGENT || 'claude-sonnet-4-6';

// Token budgets
export const CLAUDE_MAX_TOKENS_CHAT =
  parseInt(process.env.CLAUDE_MAX_TOKENS_CHAT || '800', 10);

export const CLAUDE_MAX_TOKENS_RECOMMENDATIONS =
  parseInt(process.env.CLAUDE_MAX_TOKENS_RECOMMENDATIONS || '2048', 10);

// ── MongoDB ───────────────────────────────────────────────────────────────────
export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017';

export const MONGODB_DB =
  process.env.MONGODB_DB || 'wrenchiq';

// ── API Server ────────────────────────────────────────────────────────────────
export const API_PORT =
  parseInt(process.env.API_PORT || '3001', 10);
