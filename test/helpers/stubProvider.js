/**
 * WrenchIQ — stub LLM provider for gateway tests (AE-1286)
 *
 * A real local HTTP server rather than a monkeypatched fetch, because the point
 * of these tests is what actually goes on the wire: URL path, query string,
 * auth headers, and body. A fetch stub would let a bug in URL construction or
 * header handling pass unnoticed.
 */
import http from 'node:http';

/** A minimal but complete OpenAI chat-completions response. */
export function cannedCompletion(overrides = {}) {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: 1755600000,
    model: 'stub-model',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: 'pong', refusal: null },
      finish_reason: 'stop',
      logprobs: null,
    }],
    usage: { prompt_tokens: 7, completion_tokens: 2, total_tokens: 9 },
    system_fingerprint: 'fp_test',
    ...overrides,
  };
}

/**
 * Start a stub provider.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.status]    HTTP status to return (default 200)
 * @param {object}  [opts.response]  Body to return on success
 * @param {string}  [opts.errorBody] Raw body to return on a non-2xx status
 * @returns {Promise<{seen: Array, baseV1: string, baseDeployment: string, port: number, close: Function}>}
 *   `seen` accumulates `{ url, method, headers, body, rawBody }` per request.
 */
export function startStubProvider({ status = 200, response, errorBody = 'stub error' } = {}) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { /* leave null */ }
      seen.push({ url: req.url, method: req.method, headers: { ...req.headers }, body: parsed, rawBody: raw });

      if (status >= 200 && status < 300) {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(response ?? cannedCompletion()));
      } else {
        res.writeHead(status, { 'content-type': 'text/plain' });
        res.end(errorBody);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        seen,
        port,
        // OpenAI-compatible style: Bearer auth, no api-version query.
        baseV1: `http://127.0.0.1:${port}/v1`,
        // Azure deployment style: api-key header, ?api-version= query.
        baseDeployment: `http://127.0.0.1:${port}/openai/deployments/d1`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

/** Auth-relevant headers only — the rest (User-Agent, X-Stainless-*) are transport noise. */
export function authHeadersOf(request) {
  return Object.fromEntries(
    Object.entries(request.headers).filter(([k]) => ['authorization', 'api-key'].includes(k.toLowerCase())),
  );
}
