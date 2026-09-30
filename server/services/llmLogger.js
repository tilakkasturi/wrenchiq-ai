/**
 * WrenchIQ — LLM Request Logger
 *
 * Logs every outbound LLM API call (Azure OpenAI + Anthropic) to MongoDB
 * and to stdout. Provides a query helper for the /api/llm-log endpoint.
 */

import { mongoClient } from '../index.js';
import { MONGODB_DB } from '../config.js';

const COLLECTION = 'llm_request_log';

function col() {
  return mongoClient.db(MONGODB_DB).collection(COLLECTION);
}

/**
 * Record an LLM API call.
 */
export async function logLLMRequest({
  provider,       // 'azure-openai' | 'anthropic'
  route,          // Express route that triggered the call, e.g. '/api/claude'
  model,
  baseUrl,        // the resolved profile's endpoint actually called
  promptTokens,   // estimated or actual
  completionTokens,
  totalTokens,
  durationMs,
  status,         // 'ok' | 'error'
  error,          // error message if failed
  meta,           // any extra context
}) {
  const entry = {
    provider,
    route:   route || 'unknown',
    model:   model || 'unknown',
    baseUrl: baseUrl || null,
    promptTokens:     promptTokens ?? null,
    completionTokens: completionTokens ?? null,
    totalTokens:      totalTokens ?? null,
    durationMs:       durationMs ?? null,
    status:  status || 'ok',
    error:   error || null,
    meta:    meta || null,
    ts:      new Date(),
  };

  const tag = `[LLM ${provider}]`;
  if (status === 'error') {
    console.error(`${tag} ERROR endpoint=${baseUrl || 'unknown'} model=${model} route=${route} dur=${durationMs}ms err=${error}`);
  } else {
    console.log(`${tag} endpoint=${baseUrl || 'unknown'} model=${model} route=${route} tokens=${totalTokens ?? '?'} dur=${durationMs}ms`);
  }

  try {
    await col().insertOne(entry);
  } catch (err) {
    console.error(`${tag} Failed to persist log:`, err.message);
  }
}

/**
 * Query logged requests. Supports date range and provider filters.
 */
export async function queryLLMLog({ since, until, provider, limit = 100 } = {}) {
  const filter = {};
  if (since || until) {
    filter.ts = {};
    if (since) filter.ts.$gte = new Date(since);
    if (until) filter.ts.$lte = new Date(until);
  }
  if (provider) filter.provider = provider;

  return col()
    .find(filter)
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Aggregate daily summary stats.
 */
export async function llmLogSummary({ since, until } = {}) {
  const match = {};
  if (since || until) {
    match.ts = {};
    if (since) match.ts.$gte = new Date(since);
    if (until) match.ts.$lte = new Date(until);
  }

  const pipeline = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $group: {
        _id: {
          date:     { $dateToString: { format: '%Y-%m-%d', date: '$ts' } },
          provider: '$provider',
          model:    '$model',
        },
        count:            { $sum: 1 },
        totalTokens:      { $sum: { $ifNull: ['$totalTokens', 0] } },
        totalDurationMs:  { $sum: { $ifNull: ['$durationMs', 0] } },
        errors:           { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.date': -1 } },
  ];

  return col().aggregate(pipeline).toArray();
}
