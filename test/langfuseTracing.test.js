/**
 * WrenchIQ — Langfuse tracing bootstrap (AE-1319)
 *
 * Unit-tests server/services/langfuseTracing.js in isolation: the env-gating
 * (off by default, warns-and-skips on a half-configured setup) and, when
 * enabled, that the OTEL TracerProvider is registered exactly once and the
 * CallbackHandler is built with the caller's tags. The Langfuse/OTEL packages
 * are mocked here — this file is about our own wiring, not Langfuse's export
 * behaviour, which is their SDK's own test suite's job.
 *
 * Every test re-imports the module fresh (vi.resetModules), since it reads
 * LANGFUSE_* from config.js at import time — same reason the gateway/RO
 * Advisor loaders do the same (see test/helpers/loadGateway.js).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ENV_KEYS = ['LANGFUSE_ENABLED', 'LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_BASE_URL'];

function setEnv(values) {
  for (const key of ENV_KEYS) {
    if (values[key] !== undefined) process.env[key] = values[key];
    else delete process.env[key];
  }
}

describe('langfuseTracing', () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('is a no-op when LANGFUSE_ENABLED is unset', async () => {
    vi.resetModules();
    setEnv({});
    const { buildLangfuseHandler } = await import('../server/services/langfuseTracing.js');

    const handler = await buildLangfuseHandler({ tags: ['ro-advisor'] });
    expect(handler).toBeNull();
  });

  it('warns and skips when enabled but keys are missing', async () => {
    vi.resetModules();
    setEnv({ LANGFUSE_ENABLED: 'true' });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { buildLangfuseHandler } = await import('../server/services/langfuseTracing.js');

    const handler = await buildLangfuseHandler({ tags: ['ro-advisor'] });

    expect(handler).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY are missing'));
    warnSpy.mockRestore();
  });

  it('withLangfuseTrace runs fn untraced when LANGFUSE_ENABLED is unset', async () => {
    vi.resetModules();
    setEnv({});
    const { withLangfuseTrace } = await import('../server/services/langfuseTracing.js');

    const fn = vi.fn(async () => 'done');
    await expect(withLangfuseTrace({ tags: ['core-ro-agent'], sessionId: 's' }, fn)).resolves.toBe('done');
    expect(fn).toHaveBeenCalledWith(null);
  });

  describe('when enabled with both keys set', () => {
    let LangfuseSpanProcessor;
    let NodeTracerProvider;
    let registerSpy;
    let CallbackHandler;
    let propagateAttributes;

    beforeEach(() => {
      vi.resetModules();
      setEnv({
        LANGFUSE_ENABLED: 'true',
        LANGFUSE_PUBLIC_KEY: 'pk-test',
        LANGFUSE_SECRET_KEY: 'sk-test',
        LANGFUSE_BASE_URL: 'https://langfuse.test',
      });

      registerSpy = vi.fn();
      LangfuseSpanProcessor = vi.fn(function LangfuseSpanProcessor(params) { this.params = params; });
      vi.doMock('@langfuse/otel', () => ({ LangfuseSpanProcessor }));

      NodeTracerProvider = vi.fn(function NodeTracerProvider(config) {
        this.config = config;
        this.register = registerSpy;
      });
      vi.doMock('@opentelemetry/sdk-trace-node', () => ({ NodeTracerProvider }));

      CallbackHandler = vi.fn(function CallbackHandler(params) { this.params = params; });
      vi.doMock('@langfuse/langchain', () => ({ CallbackHandler }));

      propagateAttributes = vi.fn((_params, fn) => fn());
      vi.doMock('@langfuse/tracing', () => ({ propagateAttributes }));
    });

    it('registers a TracerProvider with a LangfuseSpanProcessor built from config, and returns a CallbackHandler', async () => {
      const { buildLangfuseHandler } = await import('../server/services/langfuseTracing.js');

      const handler = await buildLangfuseHandler({ tags: ['ro-advisor'] });

      expect(LangfuseSpanProcessor).toHaveBeenCalledWith({
        publicKey: 'pk-test',
        secretKey: 'sk-test',
        baseUrl: 'https://langfuse.test',
      });
      expect(NodeTracerProvider).toHaveBeenCalledTimes(1);
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(CallbackHandler).toHaveBeenCalledWith({ tags: ['ro-advisor'] });
      expect(handler).toBeInstanceOf(CallbackHandler);
    });

    it('withLangfuseTrace propagates string trace attributes and hands fn the handler', async () => {
      const { withLangfuseTrace } = await import('../server/services/langfuseTracing.js');

      const fn = vi.fn(async (callbacks) => callbacks);
      const callbacks = await withLangfuseTrace({
        tags: ['core-ro-agent'], sessionId: 'ro-1', traceName: 'step',
        metadata: { turnId: 't-1', step: 2, vehicle: '', missing: undefined },
      }, fn);

      expect(propagateAttributes).toHaveBeenCalledWith(
        { tags: ['core-ro-agent'], sessionId: 'ro-1', traceName: 'step', metadata: { turnId: 't-1', step: '2' } },
        expect.any(Function),
      );
      expect(callbacks).toHaveLength(1);
      expect(callbacks[0]).toBeInstanceOf(CallbackHandler);
    });

    it('withLangfuseTrace runs fn untraced, once, when tracing setup throws', async () => {
      CallbackHandler.mockImplementation(() => { throw new Error('boom'); });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { withLangfuseTrace } = await import('../server/services/langfuseTracing.js');

      const fn = vi.fn(async () => 'done');
      await expect(withLangfuseTrace({ tags: ['x'] }, fn)).resolves.toBe('done');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(null);
      expect(propagateAttributes).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('registers the TracerProvider only once across repeated calls', async () => {
      const { buildLangfuseHandler } = await import('../server/services/langfuseTracing.js');

      await buildLangfuseHandler({ tags: ['a'] });
      await buildLangfuseHandler({ tags: ['b'] });

      expect(NodeTracerProvider).toHaveBeenCalledTimes(1);
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(CallbackHandler).toHaveBeenCalledTimes(2);
    });
  });
});
