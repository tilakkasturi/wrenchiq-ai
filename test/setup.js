/**
 * WrenchIQ — global test setup (AE-1286)
 *
 * Two jobs, both defensive:
 *
 * 1. Stop server/index.js from booting. llmLogger.js imports `mongoClient` from
 *    ../index.js, and server/index.js calls startServer() at module scope — so
 *    anything that imports the LLM gateway transitively binds port 3001,
 *    connects to Mongo, and process.exit(1)s if Mongo is unreachable. In vitest
 *    that kills the worker with no useful message. Mocking it is the only way
 *    out that doesn't require reshaping production imports.
 *
 * 2. Scrub provider env vars. @langchain/openai and openai@6 both fall back to
 *    reading credentials and base URLs from the environment, so a developer's
 *    real .env.local could silently make a test pass (or send a request to a
 *    real endpoint). If a future package version starts reading a NEW variable,
 *    a test that depends on it failing will surface it here rather than in prod.
 */
import { vi } from 'vitest';

vi.mock('../server/index.js', () => ({
  mongoClient: {
    db: () => ({
      collection: () => ({
        insertOne: async () => ({ acknowledged: true }),
        findOne: async () => null,
        find: () => ({ toArray: async () => [], sort: () => ({ limit: () => ({ toArray: async () => [] }) }) }),
        createIndex: async () => {},
      }),
    }),
  },
}));

// Tests exercise the real wire path against a local stub provider, so fetch has
// to work — but only to loopback. Anything leaving the machine is a bug (a real
// endpoint reached by accident, or a base URL that didn't get overridden), so
// fail loudly instead of hanging or, worse, sending real traffic.
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : (input?.url ?? String(input));
  if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(url)) {
    throw new Error(`unexpected non-loopback network call in test: ${url}`);
  }
  return realFetch(input, init);
};

const PROVIDER_ENV_VARS = [
  'OPENAI_API_KEY',
  'OPENAI_ADMIN_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_API_BASE',
  'OPENAI_ORGANIZATION',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_BASE_PATH',
  'AZURE_OPENAI_API_INSTANCE_NAME',
  'AZURE_OPENAI_API_DEPLOYMENT_NAME',
  'AZURE_OPENAI_API_VERSION',
  'ANTHROPIC_API_KEY',
  'LANGSMITH_GATEWAY',
  'LANGSMITH_API_KEY',
  'LANGSMITH_TRACING',
  'LANGCHAIN_API_KEY',
  'LANGCHAIN_TRACING_V2',
];

for (const key of PROVIDER_ENV_VARS) delete process.env[key];
