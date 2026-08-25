# WrenchIQ tests

```bash
npm test          # run once
npm run test:watch
```

vitest, plain ESM, Node 20. Introduced in AE-1286 to make the LangChain gateway
migration verifiable. Two areas are covered: the LLM gateway, and the RO Advisor
agent that sits on top of it.

## Layout

| Path | What it holds |
|---|---|
| `setup.js` | Global setup — see "Two hazards" below. Runs before every file. |
| `helpers/loadGateway.js` | Loads the gateway with synthetic profiles and a captured logger. |
| `helpers/stubProvider.js` | A real local HTTP server standing in for the LLM. |
| `helpers/engines.js` | The `LLM_ENGINE` values every suite runs over. |
| `helpers/loadROAdvisor.js` | Loads the RO Advisor with both flags set, plus its RO/vehicle/result fixtures. |
| `fixtures/callSites.js` | The argument shape of all 15 production LLM call sites. |
| `gateway.*.test.js` | Request, response, quirks, errors, lifecycle. |
| `health.test.js` | `checkLLMHealth`. |
| `roAdvisor.agent.test.js` | The agent's tool loop, over every `LLM_ENGINE`. |
| `langfuseTracing.test.js` | `langfuseTracing.js`'s own env-gating and OTEL bootstrap, in isolation (Langfuse/OTEL packages mocked). |
| `roAdvisor.langfuse.test.js` | Proves the LangChain tool loop actually calls `buildLangfuseHandler()` and feeds the result into `agent.invoke`'s callbacks — `LLM_ENGINE=langchain` only. |

## Two hazards `setup.js` works around

1. **`server/index.js` boots at import.** It calls `startServer()` at module
   scope, and `llmLogger.js` imports `mongoClient` back from it — so anything
   that imports the LLM gateway transitively binds port 3001, connects to Mongo,
   and `process.exit(1)`s if Mongo is unreachable. In vitest that kills the
   worker with no useful message. The module is mocked out.

2. **The LLM SDKs read the environment.** `@langchain/openai` and `openai@6` both
   fall back to `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AZURE_OPENAI_*`, the
   LangSmith variables, and (since AE-1319) `LANGFUSE_*`. A developer's real
   `.env.local` could otherwise make a test pass, or send real traffic. Those
   are deleted, and `fetch` is restricted to loopback so anything leaving the
   machine fails loudly.

If a future SDK version starts reading a *new* variable, the isolation tests in
`gateway.lifecycle.test.js` are what should catch it.

## Conventions

- Assert on the **wire**, not on internals. Tests stand up `stubProvider` and
  check the URL, headers and parsed body that actually got sent. A mocked `fetch`
  would let a URL-construction or header bug pass.
- Compare bodies with `toEqual`, not string equality — key order is an
  implementation detail of whichever HTTP client is underneath. Compare headers
  through an allowlist: transport headers (`User-Agent`, `X-Stainless-*`)
  legitimately differ between clients, auth headers must not.
- **No snapshot files.** A snapshot that gets `-u`'d is how an as-is migration
  quietly stops being as-is.
- Every suite that describes gateway behaviour runs over `ENGINES`, so it is a
  parity check rather than a description of one implementation.
- Keep `fixtures/callSites.js` in step with the real call sites. If it drifts,
  the suite is testing fiction.

## Adding a call site

When a new server-side LLM call is added, add its arguments to
`fixtures/callSites.js` with its real `_route` tag. The request-parity suite
picks it up automatically. `_route` is the only observability key into
`llm_request_log`, so it should be stable and unique per call site.

## Adding a runtime to the RO Advisor

`roAdvisor.agent.test.js` runs every assertion over each value of
`LLM_ENGINE`, so a new runtime is added to its `RUNTIMES` array and has to
satisfy the existing suite rather than bring its own. What the suite pins is the
contract the Sidecar depends on — summed `usage`, the five `dataSourced`
counters, the captured `model` — plus the wire shapes a framework tends to
"helpfully" alter: `content: null` on a replayed assistant turn, byte-intact
tools, and no extra top-level or per-message fields.

Two things to know before scripting turns:

- **Give each canned completion its own `id`.** LangGraph's message state is a
  reducer keyed on message id, so reusing one makes a later turn *overwrite* an
  earlier one instead of appending — the run then looks plausible while testing a
  conversation that cannot happen.
- **`startStubProvider({ responses: [...] })`** serves bodies in order, repeating
  the last, which is what makes a multi-turn run scriptable at all.

## What is not covered

Route handlers, prompt construction, MongoDB access, and everything browser-side.
The gateway was scoped first because it is the seam the migration moves, and the
RO Advisor second because it is the only tool-calling agent; the rest has no
tests yet.
