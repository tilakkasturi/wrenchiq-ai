import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    // test/record/ drives the real LLM to refresh fixtures — never part of `npm test`.
    exclude: ['test/record/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./test/setup.js'],
    // Forks, not threads: llmProviderConfig.js holds a mutable module-level
    // _activeProfile and the gateway holds a module-level client cache, so tests
    // need real process isolation rather than shared-memory workers.
    pool: 'forks',
    restoreMocks: true,
    clearMocks: true,
  },
});
