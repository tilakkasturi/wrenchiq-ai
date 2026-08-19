/**
 * WrenchIQ — engines under test (AE-1286)
 *
 * The characterisation suite runs identically against every value of
 * LLM_ENGINE. While only the fetch path exists this is a single entry; once the
 * LangChain path lands, adding it here makes the whole suite a parity check
 * rather than a one-sided description.
 *
 * `undefined` means "whatever the module default is" — used before the flag
 * exists, and afterwards to prove the default is what we think it is.
 */
// Add 'langchain' here in the step that implements it (AE-1286 step 6) — that
// one-line change turns every suite below into a legacy-vs-LangChain parity test.
export const ENGINES = ['legacy', undefined];

/** Human label for describe() blocks. */
export const engineLabel = (engine) => `LLM_ENGINE=${engine ?? '(default)'}`;
