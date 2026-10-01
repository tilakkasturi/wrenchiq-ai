/**
 * WrenchIQ — API Server
 * Serves repair order data from MongoDB.
 *
 * Usage:
 *   MONGODB_URI=mongodb://localhost:27017 node server/index.js
 *   -- or configure in .env.local --
 */

import './loadEnv.js'; // must be first — see loadEnv.js for why

import express from 'express';
import cors    from 'cors';
import { MongoClient } from 'mongodb';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { checkLLMHealth } from './services/azureOpenAI.js';
import repairOrderRoutes      from './routes/repairOrders.js';
import knowledgeGraphRoutes   from './routes/knowledgeGraph.js';
import recommendationsRouter  from './routes/recommendations.js';
import agentRouter            from './routes/agent.js';
import roAgentRouter          from './routes/roAgent.js';
import aroAgentRouter         from './routes/aroAgent.js';
import demoRORouter           from './routes/demoRO.js';
import claudeProxyRouter      from './routes/claudeProxy.js';
import snapshotRouter         from './routes/snapshot.js';
import shopGoalsRouter        from './routes/shopGoals.js';
import shopConfigRouter       from './routes/shopConfig.js';
import goldStandardChecklistRouter from './routes/goldStandardChecklist.js';
import roGoldStandardScoreRouter from './routes/roGoldStandardScore.js';
import roValueScoreRouter        from './routes/roValueScore.js';
import tribalNotesRouter      from './routes/tribalNotes.js';
import shopVoiceSettingsRouter from './routes/shopVoiceSettings.js';
import llmProviderConfigRouter from './routes/llmProviderConfig.js';
import { hydrateActiveProfile } from './services/llmProviderConfig.js';
import demoConfigRouter from './routes/demoConfig.js';
import customerNotesRouter from './routes/customerNotes.js';
import { hydrateDemoConfig } from './services/demoConfig.js';
import customersRouter        from './routes/customers.js';
import authLogRouter          from './routes/authLog.js';
import llmLogRouter           from './routes/llmLog.js';
import roAdvisorRouter        from './routes/roAdvisor.js';
import roChatRouter           from './routes/roChat.js';
import trustScoreRouter       from './routes/trustScore.js';
import dataFeedRouter         from './routes/dataFeed.js';
import hierarchyRouter        from './routes/hierarchy.js';
import analyticsRouter        from './routes/analytics.js';
import prediiLearnRouter      from './routes/prediiLearn.js';
import cannedJobsRouter       from './routes/cannedJobs.js';
import shopProfileSnapshotRouter from './routes/shopProfileSnapshot.js';
import shopChatRouter          from './routes/shopChat.js';
import tsbLookupRouter          from './routes/tsbLookup.js';
import coreParts                from './routes/coreParts.js';
import coreAgent                from './routes/coreAgent.js';
import threeCScoreRouter        from './routes/threeCScore.js';
import shopIntelFactsRouter     from './routes/shopIntelFacts.js';
import { ensureRecommendationIndexes } from './models/Recommendation.js';
import { ensureTSBCacheIndexes } from './models/TSBCache.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const PORT        = process.env.API_PORT    || 3001;

// ── MongoDB client (shared) ──────────────────────────────────────────────────
export const mongoClient = new MongoClient(MONGODB_URI);

async function connectMongo() {
  await mongoClient.connect();
  return mongoClient.db(DB_NAME);
}

async function ensureIndexes(db) {
  try {
    const ro = db.collection('RepairOrder');
    await Promise.all([
      ro.createIndex({ status: 1, dateIn: -1 }),
      ro.createIndex({ kanbanStatus: 1, dateIn: -1 }),
      ro.createIndex({ customerId: 1, dateIn: -1 }),
      ro.createIndex({ id: 1 }, { unique: true, sparse: true }),
      ro.createIndex({ dateIn: -1 }),
    ]);
    console.log('Indexes ensured on RepairOrder.');
  } catch (err) {
    console.warn('Index creation warning:', err.message);
  }
}

// ── In-memory response cache ──────────────────────────────────────────────────
// Caches GET responses to avoid repeated DB queries on the same data.
// TTL = 5 minutes (sufficient for dashboard loads; cleared on server restart).
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map(); // key → { data, ts }

export function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry.data;
}
export function setCached(key, data) {
  responseCache.set(key, { data, ts: Date.now() });
}

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

// Attach db to every request (db is connected eagerly at startup)
app.use((req, _res, next) => {
  req.db    = req.app.locals.db;
  req.cache = { get: getCached, set: setCached };
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/repair-orders',   repairOrderRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/agent',           agentRouter);
app.use('/api/ro-agent',        roAgentRouter);
app.use('/api/ro-advisor',       roAdvisorRouter);
app.use('/api/ro-chat',          roChatRouter);
app.use('/api/trust-score',      trustScoreRouter);
app.use('/api/aro-agent',       aroAgentRouter);
app.use('/api/demo',            demoRORouter);
app.use('/api/claude',          claudeProxyRouter);
app.use('/api/snapshot',        snapshotRouter);
app.use('/api/shop-goals',      shopGoalsRouter);
app.use('/api/shop-config',     shopConfigRouter);
app.use('/api/gold-standard-checklist', goldStandardChecklistRouter);
app.use('/api/ro-gold-standard-score', roGoldStandardScoreRouter);
app.use('/api/ro-value-score',      roValueScoreRouter);
app.use('/api/tribal-notes',    tribalNotesRouter);
app.use('/api/shop-voice-settings', shopVoiceSettingsRouter);
app.use('/api/llm-provider-config', llmProviderConfigRouter);
app.use('/api/demo-config', demoConfigRouter);
app.use('/api/customer-notes', customerNotesRouter);
app.use('/api/hierarchy',       hierarchyRouter);
app.use('/api/customers',       customersRouter);
app.use('/api/auth',            authLogRouter);
app.use('/api/llm-log',         llmLogRouter);
app.use('/api/data-feed',       dataFeedRouter);
app.use('/api/analytics',       analyticsRouter);
app.use('/api/predii-learn',    prediiLearnRouter);
app.use('/api/canned-jobs',     cannedJobsRouter);
app.use('/api/shop-profile-snapshot', shopProfileSnapshotRouter);
app.use('/api/shop-chat',        shopChatRouter);
app.use('/api/tsbs',             tsbLookupRouter);
app.use('/api/core/parts',       coreParts);
app.use('/api/core/agent',       coreAgent);
app.use('/api/three-c-score',    threeCScoreRouter);
app.use('/api/shop-intel-facts', shopIntelFactsRouter);
app.use('/api',                 recommendationsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: DB_NAME, ts: new Date().toISOString() });
});

// Detailed health for the Sidecar's startup Health Check screen (WrenchIQ
// Product Spec v4.0 §1). "SMS" here is the MongoDB data feed WrenchIQ reads
// today (dataFeedService.js) — it's a real, live-pingable connection, just
// not yet pointed at a real shop's production SMS/DMS. Green means the
// configured Mongo is actually reachable, not that a live shop is connected.
async function checkMongoHealth(db) {
  const t0 = Date.now();
  try {
    await db.command({ ping: 1 });
    return {
      status: 'connected',
      latencyMs: Date.now() - t0,
      note: `Connected to ${DB_NAME} — this is Predii's demo data feed, not yet a live shop SMS/DMS`,
    };
  } catch (err) {
    return { status: 'error', latencyMs: Date.now() - t0, note: err.message };
  }
}

app.get('/api/health/detailed', async (req, res) => {
  const [llm, sms] = await Promise.all([
    checkLLMHealth(),
    checkMongoHealth(req.db),
  ]);
  res.json({ llm, sms, ts: new Date().toISOString() });
});

// ── Static frontend (production) ──────────────────────────────────────────────
// Serves dist/ when it exists (i.e. after `npm run build`).
// In dev, Vite runs separately on :5173 — this block is a no-op.
const distDir = join(__dirname, '../dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: non-API routes return index.html
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
}

// ── Start (eager MongoDB connect) ────────────────────────────────────────────
async function startServer() {
  try {
    const db = await connectMongo();
    await ensureIndexes(db);
    await ensureRecommendationIndexes(db);
    await ensureTSBCacheIndexes(db);
    app.locals.db = db;
    await hydrateActiveProfile(db);
    await hydrateDemoConfig(db);

    app.listen(PORT, () => {
      const masked = MONGODB_URI.replace(/:\/\/.*@/, '://<credentials>@');
      const hasDist = existsSync(distDir);
      console.log(`\nWrenchIQ      → http://localhost:${PORT}${hasDist ? '' : '  (API only — no dist/ found)'}`);
      console.log(`MongoDB       → ${masked}`);
      console.log(`Database      → ${DB_NAME}`);
      if (hasDist) console.log(`Frontend      → http://localhost:${PORT}  (serving dist/)`);
      console.log('');
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
