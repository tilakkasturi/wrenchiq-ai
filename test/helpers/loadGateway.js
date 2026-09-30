/**
 * WrenchIQ — gateway loader for tests (AE-1286)
 *
 * The gateway resolves its endpoint from llmProviderConfig.js, which reads
 * config.js, which reads process.env into top-level consts at import time. That
 * means real credentials would leak into tests and test profiles could not be
 * injected. So we mock llmProviderConfig.js with synthetic profiles and
 * re-import the gateway fresh each time.
 *
 * Fresh re-import also matters because the LangChain gateway holds a
 * module-level client cache: without vi.resetModules() a cached client from a
 * previous test's stub server (now closed) would be reused.
 */
import { vi } from 'vitest';

/**
 * @param {object} options
 * @param {Record<string, object>} options.profiles  Synthetic LLM_PROFILES map.
 * @param {string} [options.activeProfile]  What getActiveLLMProfile() returns (default 'default').
 * @param {string} [options.engine]  'loop' | 'langchain' — sets LLM_ENGINE before import.
 * @returns {Promise<{gateway: object, logCalls: Array}>} `logCalls` accumulates
 *   every logLLMRequest() argument object, in call order.
 */
export async function loadGateway({ profiles, activeProfile = 'default', engine } = {}) {
  vi.resetModules();

  if (engine !== undefined) process.env.LLM_ENGINE = engine;
  else delete process.env.LLM_ENGINE;

  const logCalls = [];
  vi.doMock('../../server/services/llmLogger.js', () => ({
    logLLMRequest: async (entry) => { logCalls.push(entry); },
  }));

  if (profiles) {
    vi.doMock('../../server/services/llmProviderConfig.js', () => ({
      LLM_PROFILES: profiles,
      getActiveLLMProfile: () => ({ profileKey: activeProfile, ...profiles[activeProfile] }),
      // Always the 'default' entry regardless of activeProfile — matches
      // production's getDefaultProfile(), independent of the Settings
      // "AI Engine" (activeProfile) toggle these tests exercise.
      getDefaultProfile: () => ({ profileKey: 'default', ...profiles.default }),
      isProfileConfigured: (key) => !!profiles[key]?.baseUrl,
      hydrateActiveProfile: async () => {},
      setActiveProfile: async () => {},
      getPublicStatus: () => ({ activeProfile, profiles: {} }),
    }));
  }

  const gateway = await import('../../server/services/azureOpenAI.js');
  return { gateway, logCalls };
}

/**
 * Synthetic profiles covering every endpoint shape the gateway must handle.
 * `baseUrl` is filled in per-test from the stub server's address.
 */
export function makeProfiles({ baseV1, baseDeployment }) {
  return {
    // The live demo shape: OpenAI-compatible endpoint, NO api key.
    default: {
      label: 'Stub Predii LLM',
      baseUrl: baseV1,
      apiKey: '',
      model: 'stub-model',
      apiVersion: '2024-12-01-preview',
    },
    // Azure deployment shape: api-key header + api-version query.
    azure: {
      label: 'Stub Azure',
      baseUrl: baseDeployment,
      apiKey: 'AZ-TEST-KEY',
      model: 'gpt-4o',
      apiVersion: '2024-12-01-preview',
    },
    // OpenAI-compatible WITH a key, so Bearer auth is exercised.
    frontier: {
      label: 'Stub Frontier',
      baseUrl: baseV1,
      apiKey: 'sk-TEST-KEY',
      model: 'gpt-5-chat',
      apiVersion: '2024-12-01-preview',
    },
    // Deliberately unconfigured — profileKey must throw for this one.
    unconfigured: {
      label: 'Stub Unconfigured',
      baseUrl: '',
      apiKey: '',
      model: 'nope',
      apiVersion: '2024-12-01-preview',
    },
  };
}
