/**
 * WrenchIQ — Langfuse tracing bootstrap (RO Advisor, LangChain runtime only)
 *
 * Langfuse's current JS SDK is OpenTelemetry-based: a `LangfuseSpanProcessor`
 * has to be registered on a global OTEL TracerProvider exactly once per
 * process before any `CallbackHandler` it hands out will actually export
 * anything (see @langfuse/otel's README) — unlike the legacy `langfuse-langchain`
 * package (incompatible with this repo's `langchain@^1.5.10`), which took
 * credentials directly on a per-call handler. This module is the one place
 * that owns that one-time registration, so callers just ask for a handler.
 *
 * The three Langfuse/OTEL packages are dynamically imported so a process that
 * never sets LANGFUSE_ENABLED never loads them.
 */
import { LANGFUSE_ENABLED, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL } from '../config.js';

let registerTracerProvider = null;

/** Registers the global TracerProvider at most once per process. */
function ensureTracerProviderRegistered() {
  if (!registerTracerProvider) {
    registerTracerProvider = (async () => {
      const [{ LangfuseSpanProcessor }, { NodeTracerProvider }] = await Promise.all([
        import('@langfuse/otel'),
        import('@opentelemetry/sdk-trace-node'),
      ]);
      new NodeTracerProvider({
        spanProcessors: [new LangfuseSpanProcessor({
          publicKey: LANGFUSE_PUBLIC_KEY,
          secretKey: LANGFUSE_SECRET_KEY,
          baseUrl: LANGFUSE_BASE_URL,
        })],
        // Default "batched" export mode is for exactly this: a long-running
        // Express process, not a serverless one-shot — no per-request flush.
      }).register();
    })();
  }
  return registerTracerProvider;
}

/**
 * @param {object} [opts]
 * @param {string[]} [opts.tags]  Langfuse trace tags.
 * @returns {Promise<import('@langfuse/langchain').CallbackHandler|null>}
 *   `null` when tracing is off or misconfigured — callers should treat that as
 *   "run untraced", never as a reason to fail the run itself.
 */
export async function buildLangfuseHandler({ tags } = {}) {
  if (!LANGFUSE_ENABLED) return null;
  if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
    console.warn('[langfuseTracing] LANGFUSE_ENABLED is set but LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY are missing — skipping tracing');
    return null;
  }

  await ensureTracerProviderRegistered();
  const { CallbackHandler } = await import('@langfuse/langchain');
  return new CallbackHandler({ tags });
}
