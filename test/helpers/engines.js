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
// `undefined` exercises the module default, so the suite also proves the default
// is what we think it is rather than only testing explicit values.
export const ENGINES = ['legacy', 'langchain', undefined];

/** Human label for describe() blocks. */
export const engineLabel = (engine) => `LLM_ENGINE=${engine ?? '(default)'}`;
