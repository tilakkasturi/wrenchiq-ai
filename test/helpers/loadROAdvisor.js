/**
 * WrenchIQ — RO Advisor loader for tests
 *
 * Same problem loadGateway.js solves, one layer up. The RO Advisor reads
 * LLM_ENGINE and LLM_SKIP_TOOLS from config.js, which turns process.env into
 * top-level consts at import time, so both flags have to be set *before* the
 * module graph is imported — hence vi.resetModules() plus a dynamic import
 * rather than a static one.
 *
 * llmProviderConfig.js is mocked for the same reason as in loadGateway.js: to
 * point the run at a local stub provider instead of a real endpoint.
 */
import { vi } from 'vitest';

/**
 * @param {object} options
 * @param {Record<string, object>} options.profiles  Synthetic LLM_PROFILES map.
 * @param {string} [options.engine]  'loop' | 'langchain' — sets LLM_ENGINE, which drives both
 *   the gateway client and the RO Advisor's tool-calling runtime.
 * @param {boolean} [options.skipTools]  Sets LLM_SKIP_TOOLS.
 * @param {Function} [options.buildLangfuseHandler]  Replaces
 *   langfuseTracing.js's export wholesale (e.g. `vi.fn(async () => fakeHandler)`)
 *   so a test can control/observe it without touching real Langfuse/OTEL
 *   packages or LANGFUSE_* env vars.
 * @returns {Promise<{service: object, logCalls: Array}>}
 */
export async function loadROAdvisor({ profiles, engine, skipTools, buildLangfuseHandler } = {}) {
  vi.resetModules();

  setEnv('LLM_ENGINE', engine);
  setEnv('LLM_SKIP_TOOLS', skipTools ? 'true' : undefined);

  const logCalls = [];
  vi.doMock('../../server/services/llmLogger.js', () => ({
    logLLMRequest: async (entry) => { logCalls.push(entry); },
  }));

  if (buildLangfuseHandler) {
    vi.doMock('../../server/services/langfuseTracing.js', () => ({ buildLangfuseHandler }));
  }

  if (profiles) {
    vi.doMock('../../server/services/llmProviderConfig.js', () => ({
      LLM_PROFILES: profiles,
      getActiveLLMProfile: () => ({ profileKey: 'default', ...profiles.default }),
      // Matches production's getDefaultProfile() — the RO Advisor is pinned
      // to 'default' regardless of the Settings "AI Engine" toggle, and
      // 'default' itself resolves the WrenchIQ Home primary/secondary
      // switch, which these tests don't exercise (single synthetic profile).
      getDefaultProfile: () => ({ profileKey: 'default', ...profiles.default }),
      isProfileConfigured: (key) => !!profiles[key]?.baseUrl,
      hydrateActiveProfile: async () => {},
      setActiveProfile: async () => {},
      getPublicStatus: () => ({ activeProfile: 'default', profiles: {} }),
    }));
  }

  const service = await import('../../server/services/roAdvisorService.js');
  return { service, logCalls };
}

function setEnv(key, value) {
  if (value !== undefined) process.env[key] = value;
  else delete process.env[key];
}

/**
 * A repair order in the shape the Sidecar actually POSTs (see
 * WrenchIQSidecarScreen.jsx's runAdvisorFetch) — camelCase `repairJobs`, a
 * flattened customerName/customerId, and a stated concern.
 *
 * One existing line item, because "never re-recommend something already on the
 * RO" is the behaviour most likely to be lost in a rewrite, and it can only be
 * observed if the RO has a line item to begin with.
 */
export function makeRO(overrides = {}) {
  return {
    roNumber: 'RO-2024-1001',
    shopId: 'shop-001',
    customerId: 'cust-001',
    customerName: 'Sarah Chen',
    advisorName: 'James Park',
    customerConcern: 'AC not blowing cold',
    dtcs: ['P0300'],
    totalEstimate: 240,
    repairJobs: [{ description: 'A/C System Diagnosis & Pressure Test', lineCost: 140 }],
    ...overrides,
  };
}

/** 2021 Toyota Camry — two entries in the curated TSB set (src/data/tsbData.js). */
export function makeVehicle(overrides = {}) {
  return { year: 2021, make: 'Toyota', model: 'Camry', mileage: 52000, ...overrides };
}

/** The JSON body the agent is prompted to produce, as a final assistant turn. */
export function advisorJSON(overrides = {}) {
  return JSON.stringify({
    advisorBrief: 'Sarah is due for a brake fluid flush and her AC is the stated concern.',
    serviceRecommendations: [
      {
        service: 'Brake Fluid Flush',
        reason: 'Due at 30k intervals; vehicle is at 52,000 miles.',
        estimatedCost: 89,
        confidence: 'high',
        category: 'year_round',
        tsbNumber: null,
        talkTrack: 'Your brake fluid is past due — I would like to flush it while the car is here.',
      },
      {
        // Already a line item on the RO — must be filtered out of the result.
        service: 'A/C System Diagnosis',
        reason: 'Stated concern.',
        estimatedCost: 140,
        confidence: 'high',
        category: 'seasonal',
        tsbNumber: null,
        talkTrack: 'We are looking at the AC now.',
      },
    ],
    ings: [{ note: 'Add shop supply fee ($29.95) to every RO before closing', applies: true, reason: 'Applies to every RO.' }],
    alerts: [{ type: 'dtc', message: 'P0300 present — random misfire.' }],
    suggestedCustomerMessage: 'Hi Sarah, we are taking a look at the AC for you. Your brake fluid is also due. — James',
    ...overrides,
  });
}
