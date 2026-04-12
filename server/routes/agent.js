/**
 * WrenchIQ — Managed Agent Routes
 *
 * POST /api/agent/sessions          — Create a new agent session
 * POST /api/agent/sessions/:id/stream — Send a message and stream the response (SSE)
 */

import { Router } from 'express';
import { createSession, streamMessage } from '../services/managedAgent.js';

const router = Router();

// ── POST /api/agent/sessions ──────────────────────────────────────────────────
// Creates a new managed agent session. Returns { sessionId }.
router.post('/sessions', async (req, res) => {
  try {
    const { title } = req.body;
    const result = await createSession(title);
    res.json(result);
  } catch (err) {
    console.error('[agent] createSession error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/agent/sessions/:sessionId/stream ────────────────────────────────
// Sends { message } to the session and streams agent events back as SSE.
// Client receives: data: <json>\n\n  for each event.
router.post('/sessions/:sessionId/stream', async (req, res) => {
  const { sessionId } = req.params;
  const { message }   = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if proxied
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await streamMessage(sessionId, message, (event) => {
      send({ type: event.type, event });
    });

    // Signal completion to the client
    send({ type: 'done' });
    res.end();
  } catch (err) {
    console.error(`[agent] streamMessage error (session=${sessionId}):`, err.message);
    send({ type: 'error', error: err.message });
    res.end();
  }
});

export default router;
