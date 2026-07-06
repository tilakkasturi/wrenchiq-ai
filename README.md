# WrenchIQ

**"The Dealership's Intelligence. The Neighborhood's Trust."**

WrenchIQ is your AI assistant for fixed ops and independent repair — a trusted partner that handles the background work so advisors, technicians, and owners can focus on the customer in front of them. It works alongside your existing tools, not instead of them.

Built by [Predii, Inc.](https://predii.com) — CONFIDENTIAL.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# 3. Start the API server (terminal 1)
PATH="/opt/homebrew/opt/node@24/bin:$PATH" node --env-file=.env.local server/index.js

# 4. Start the Vite dev server (terminal 2)
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Node path:** Node 24 is at `/opt/homebrew/opt/node@24/bin/node`. Prefix commands with
> `PATH="/opt/homebrew/opt/node@24/bin:$PATH"` if `node`/`npm` is not found.

---

## Editions

| Entry point | URL | Description |
|-------------|-----|-------------|
| `index.html` | `/` | WrenchIQ-AM — full aftermarket shop management |
| `oem.html` | `/oem.html` | WrenchIQ-OEM — dealership portal |
| `am-3c.html` | `/am-3c.html` | WrenchIQ-AM — standalone 3C Story Writer |

---

## Architecture

### Persona gateway

`WrenchIQApp.jsx` → `PersonaGatewayScreen.jsx` → persona selection → `PersonaShell.jsx` (nav + AI panel).

**AM personas:** `advisor`, `tech`, `owner`, `customer`, `advisorLite`
**OEM personas:** `fixedOps`, `oemAdvisor`, `oemTech`

### AI panel — WrenchIQ Intelligence

`src/components/WrenchIQAgent.jsx` — fixed right panel, context-aware per screen.

### RO Advisor Agent

A tool-calling LLM agent (`server/services/roAdvisorService.js`) that fires every time an advisor selects a repair order. It consults three data sources in parallel via OpenAI-format tool calls:

| Tool | Source |
|------|--------|
| `get_customer_history` | `RepairOrder` + `wrenchiq_ro` collections (up to 8 most recent visits) |
| `get_shop_objectives` | `tribal_notes` collection (active ings / advisor reminders) |
| `get_mileage_services` | Domain knowledge — standard maintenance intervals by make/model/mileage |

Returns: `advisorBrief`, `upsells[]` with talk tracks, `ings[]`, `alerts[]`.

Set `LLM_SKIP_TOOLS=true` to bypass tool calling and use a single-pass prompt with pre-injected data (for LLM servers that don't support tool_calls).

---

## MongoDB

**Primary host:** `172.16.80.7:27017` (dst)
**Source host:** `172.16.80.16:27017` (src, import only)
**Database:** `wrenchiq`

### Collections

| Collection | Docs | Description |
|------------|------|-------------|
| `RepairOrder` | ~1,100 | Seeded demo ROs — primary operational collection |
| `wrenchiq_ro` | ~100,000 | Production import — real shop ROs, used for customer history |
| `tribal_notes` | varies | Shop ings and advisor reminders, scoped by `shopId` |
| `Recommendation` | varies | Cached AI recommendations (15-min TTL) |
| `LoginActivity` | varies | Login audit log |
| `LLMLog` | varies | LLM call log (model, tokens, duration, route) |

### RepairOrder schema (key fields)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | RO number, e.g. `RO-2024-1042` |
| `status` | String | `open` \| `estimate` \| `approved` \| `closed` |
| `kanbanStatus` | String | `checked_in` \| `inspecting` \| `estimate_sent` \| `approved` \| `in_progress` \| `ready` |
| `customer.id` | String | Customer ID, e.g. `cust-003` |
| `customer.name` | String | Full name |
| `vin` | String | 17-char VIN |
| `year` / `make` / `model` | String/Number | Vehicle info |
| `mileageIn` / `mileageOut` | Number | Per-visit odometer |
| `repairJobs` | Array | Service lines |
| `invoice` | Number | Total invoice amount |
| `dateIn` / `promisedDate` / `closedDate` | ISO String | Timestamps |

---

## Seed Data

```bash
bin/seed-batch              # batch 1 — customers 1-25 (default)
bin/seed-batch 2            # batch 2 — customers 26-50
bin/seed-batch --reset      # drop collection, re-seed batch 1
bin/seed-list               # print all batches and customer rosters
```

| Batch | Customers | ROs | Profiles |
|-------|-----------|-----|---------|
| 1 | 1–25 | 100 | Palo Alto — tech workers, professors, attorneys |
| 2 | 26–50 | 100 | SF/South Bay — Uber, Airbnb, Stripe, Waymo engineers |
| 3 | 51–75 | 100 | Tradespeople, medical workers, local businesses |
| 4 | 76–100 | 100 | Executives, academics, specialty vehicles |

---

## bin/ Scripts

```
bin/
  server          Start the WrenchIQ API server (port $API_PORT, default 3001)
  package         Build + package a versioned release tarball
  seed-batch      Seed a batch of demo repair orders into MongoDB
  seed-list       Print all batches and customer rosters
```

### `bin/package`

Builds the frontend (`npm run build`), increments `version.json`, and creates a versioned tarball under `releases/`.

```bash
bin/package              # build + package (increments minor version)
bin/package --no-build   # package without rebuilding (server/config changes only)
```

Output: `releases/wrenchiq-deploy-YYYY-MM-DD-HHMM-vX.Y.tar.gz` + `wrenchiq-deploy-latest.tar.gz` symlink.

---

## Deploy

Deploy target: `wrenchiq-demo` SSH host (`172.16.40.19`), path `/opt/predii/wrenchiq`.

```bash
# 1. Build and package
bin/package

# 2. Upload and deploy
scp releases/wrenchiq-deploy-latest.tar.gz releases/deploy-remote.sh wrenchiq-demo:~/Downloads/
ssh wrenchiq-demo 'bash ~/Downloads/deploy-remote.sh'
```

The deploy script:
- Extracts the tarball to `/opt/predii/wrenchiq`
- Preserves the existing `.env.local` (never overwrites)
- Runs `npm install --omit=dev`
- Stops any running server and starts a fresh one
- Logs to `/tmp/wrenchiq-server.log`

After first deploy, manually add new env vars to `/opt/predii/wrenchiq/.env.local` via SSH if they were not in the original `.env.local`.

### Check deploy

```bash
ssh wrenchiq-demo 'curl -s http://localhost:3001/api/health'
ssh wrenchiq-demo 'cat /opt/predii/wrenchiq/version.json'
ssh wrenchiq-demo 'tail -f /tmp/wrenchiq-server.log'
```

---

## API Endpoints

Base URL: `http://localhost:3001`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/repair-orders` | List ROs (filterable by status, kanbanStatus, customerId, vin) |
| GET | `/api/repair-orders/active` | Active queue (open/estimate/approved) |
| GET | `/api/repair-orders/:id` | Single RO |
| PATCH | `/api/repair-orders/:id/status` | Update workflow status |
| POST | `/api/ro-advisor` | RO Advisor Agent — upsells + talk tracks for a specific RO |
| GET | `/api/recommendations` | AI shop recommendations (15-min MongoDB cache) |
| GET/POST | `/api/knowledge-graph` | Knowledge graph queries |
| POST | `/api/knowledge-graph/ask` | Chat with the knowledge graph (LLM) |
| GET/POST | `/api/tribal-notes` | Shop ings / advisor reminders |
| GET/POST | `/api/shop-goals` | Shop objectives |
| POST | `/api/claude` | Claude proxy (client-side LLM calls) |
| GET | `/api/snapshot` | Shop snapshot for recommendation engine |
| POST | `/api/auth/log` | Record login attempt |
| GET | `/api/auth/activity` | Recent login activity |
| GET | `/api/llm-log` | LLM call log (model, tokens, duration) |

### POST /api/ro-advisor

```bash
curl -s -X POST http://localhost:3001/api/ro-advisor \
  -H "Content-Type: application/json" \
  -d '{
    "ro":       { "customerName": "Brenda Okafor", "customerId": "cust-003",
                  "serviceType": "Emissions Diagnostic", "dtcs": ["P0420"] },
    "customer": { "id": "cust-003" },
    "vehicle":  { "year": 2020, "make": "Toyota", "model": "Camry", "mileage": 67000 },
    "shopId":   "shop-001"
  }'
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# MongoDB
MONGODB_URI=mongodb://172.16.80.7:27017
MONGODB_DB=wrenchiq
SOURCE_MONGODB_URI=mongodb://172.16.80.16:27017/

# Server
API_PORT=3001
VITE_API_BASE=http://localhost:3001

# LLM — generic (takes priority over Azure vars)
LLM_BASE_URL=http://192.222.55.177:8081/v1   # vLLM or any OpenAI-compatible endpoint
LLM_API_KEY=                                  # leave empty for local servers
LLM_MODEL=Qwen/Qwen3-VL-32B-Instruct-FP8
LLM_SKIP_TOOLS=false                          # set true if server doesn't support tool_calls

# LLM — browser-side (Vite)
VITE_LLM_BASE_URL=http://192.222.55.177:8081
VITE_LLM_API_KEY=
VITE_LLM_MODEL=Qwen/Qwen3-VL-32B-Instruct-FP8

# Claude / Anthropic (optional — used for 3C Story Writer browser-side calls)
VITE_ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_API_KEY=sk-ant-...
```

### LLM fallback chain

Server: `LLM_BASE_URL` → `AZURE_OPENAI_API_BASE`
Browser: `VITE_LLM_BASE_URL` → `VITE_ANTHROPIC_API_KEY` → server proxy (`/api/claude`)

---

## Versioning

`version.json` tracks `{ major, minor }`. `bin/package` increments minor (rolls to next major at 10).

Version and build date are injected at build time as `__APP_VERSION__` and `__APP_BUILT__` — consumed by `src/hooks/useAppVersion.js` and displayed in the login screen and footers.

---

## Tech Stack

- **Frontend:** React 19, Vite 6, Recharts, Lucide React
- **Backend:** Node.js 24, Express 5, MongoDB 7
- **AI:** OpenAI-compatible tool-calling agent (vLLM / Qwen3), Anthropic Claude (3C pipeline)
- **Build:** Multi-entry Vite (`main` / `oem` / `am-3c`)

---

*PREDII CONFIDENTIAL — © 2026 Predii, Inc.*
