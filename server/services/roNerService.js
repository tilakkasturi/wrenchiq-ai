/**
 * WrenchIQ — ro-ner-demo proxy service
 *
 * Thin client for the separate ro-ner-demo FastAPI service (assumed already
 * running on RO_NER_BASE_URL). Keeps the URL and streaming plumbing out of
 * the route handlers.
 */

import { RO_NER_BASE_URL } from '../config.js';

export async function checkHealth() {
  const res = await fetch(`${RO_NER_BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`ro-ner-demo health check failed: ${res.status}`);
  return res.json();
}

export async function getShopProfile({ years } = {}) {
  const url = new URL(`${RO_NER_BASE_URL}/api/shop_profile`);
  if (years) url.searchParams.set('years', years);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ro-ner-demo shop_profile failed: ${res.status}`);
  return res.json();
}

/**
 * Proxies POST /api/batch/stream (SSE) straight through to the Express response.
 * @param {object} opts - { years, n, datasources }
 * @param {import('express').Response} res
 */
export async function streamBatch({ years, n, datasources } = {}, res) {
  const upstream = await fetch(`${RO_NER_BASE_URL}/api/batch/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // category defaults to 'balanced' server-side (an even mechanical/
    // maintenance split), which silently caps the effective total below `n`
    // whenever one category has fewer available records than half of `n` —
    // e.g. requesting n=1797 for cornerstone's 2-year window actually
    // returned 1,314. WrenchIQ always wants "process everything in the
    // selected window," so force 'all' rather than the balanced default.
    body: JSON.stringify({ n, datasources, years, category: 'all' }),
  });

  if (!upstream.ok || !upstream.body) {
    throw new Error(`ro-ner-demo batch/stream failed: ${upstream.status}`);
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  for await (const chunk of upstream.body) {
    res.write(chunk);
  }
  res.end();
}
