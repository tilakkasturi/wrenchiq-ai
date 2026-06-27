/**
 * WrenchIQ — LLM Request Log API
 *
 * GET /api/llm-log          — recent requests (query: ?since=&until=&provider=&limit=)
 * GET /api/llm-log/summary  — aggregated daily stats
 */

import { Router } from 'express';
import { queryLLMLog, llmLogSummary } from '../services/llmLogger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { since, until, provider, limit } = req.query;
    const rows = await queryLLMLog({
      since,
      until,
      provider,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json({ count: rows.length, rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { since, until } = req.query;
    const stats = await llmLogSummary({ since, until });
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
