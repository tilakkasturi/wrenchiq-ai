/**
 * WrenchIQ — Langfuse tracing bootstrap (LangChain runtime only)
 *
 * Two callers: the RO Advisor's createAgent tool loop (roAdvisorLangChainAgent.js,
 * via buildLangfuseHandler) and the Core repair order agent's single model call
 * per step (coreAgentService.js, via withLangfuseTrace).
 *
 * Langfuse's current JS SDK is OpenTelemetry-based: a `LangfuseSpanProcessor`
 * has to be registered on a global OTEL TracerProvider exactly once per
 * process before any `CallbackHandler` it hands out will actually export
 * anything (see @langfuse/otel's README) — unlike the legacy `langfuse-langchain`
 * package (incompatible with this repo's `langchain@^1.5.10`), which took
 * credentials directly on a per-call handler. This module is the one place
 * that owns that one-time registration, so callers just ask for a handler.
 *
 * The Langfuse/OTEL packages are dynamically imported so a process that
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

/**
 * Run `fn` traced, with trace-level attributes that stick.
 *
 * CallbackHandler only applies its tags/sessionId/traceMetadata when the root
 * run is a chain (handleChainStart with no parent) — true for a createAgent
 * graph, but not for a bare chat-model invoke, whose root is a generation, so
 * those attributes would be silently dropped. propagateAttributes (what the
 * handler itself uses for chain roots) sets them on the active OTEL context
 * instead, so every span started inside `fn` carries them.
 *
 * @param {object} attrs
 * @param {string[]} [attrs.tags]
 * @param {string}   [attrs.sessionId]  Groups traces into one Langfuse session.
 * @param {string}   [attrs.traceName]
 * @param {object}   [attrs.metadata]   Values are stringified (Langfuse wants strings).
 * @param {(callbacks: object[]|null) => Promise<T>} fn
 *   Receives the callbacks to hand to LangChain, or null to run untraced.
 * @returns {Promise<T>}
 * @template T
 */
export async function withLangfuseTrace({ tags, sessionId, traceName, metadata } = {}, fn) {
  let handler = null;
  let propagateAttributes = null;
  try {
    handler = await buildLangfuseHandler({ tags });
    if (handler) ({ propagateAttributes } = await import('@langfuse/tracing'));
  } catch (err) {
    console.warn('[langfuseTracing] tracing unavailable, running untraced:', err.message);
    handler = null;
  }
  if (!handler || !propagateAttributes) return fn(null);

  const stringMetadata = metadata && Object.fromEntries(
    Object.entries(metadata)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
  );
  return propagateAttributes(
    {
      tags,
      ...(sessionId ? { sessionId } : {}),
      ...(traceName ? { traceName } : {}),
      ...(stringMetadata ? { metadata: stringMetadata } : {}),
    },
    () => fn([handler]),
  );
}
