/**
 * WrenchIQ — API Server
 * Serves repair order data from MongoDB.
 *
 * Usage:
 *   MONGODB_URI=mongodb://localhost:27017 node server/index.js
 *   -- or configure in .env.local --
 */

import express from 'express';
import cors    from 'cors';
import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'fs';
import repairOrderRoutes      from './routes/repairOrders.js';
import knowledgeGraphRoutes   from './routes/knowledgeGraph.js';
import recommendationsRouter  from './routes/recommendations.js';
import agentRouter            from './routes/agent.js';
import roAgentRouter          from './routes/roAgent.js';
import aroAgentRouter         from './routes/aroAgent.js';
import demoRORouter           from './routes/demoRO.js';
import { ensureRecommendationIndexes } from './models/Recommendation.js';

// ── Load .env.local ──────────────────────────────────────────────────────────
for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) {
    const lines = readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
    break;
  }
}

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
app.use('/api/aro-agent',       aroAgentRouter);
app.use('/api/demo',            demoRORouter);
app.use('/api',                 recommendationsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: DB_NAME, ts: new Date().toISOString() });
});

// ── Start (eager MongoDB connect) ────────────────────────────────────────────
async function startServer() {
  try {
    const db = await connectMongo();
    await ensureIndexes(db);
    await ensureRecommendationIndexes(db);
    app.locals.db = db;

    app.listen(PORT, () => {
      const masked = MONGODB_URI.replace(/:\/\/.*@/, '://<credentials>@');
      console.log(`\nWrenchIQ API  → http://localhost:${PORT}`);
      console.log(`MongoDB       → ${masked}`);
      console.log(`Database      → ${DB_NAME}\n`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
