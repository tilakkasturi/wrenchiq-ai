# WrenchIQ

**"The Dealership's Intelligence. The Neighborhood's Trust."**

WrenchIQ is your AI assistant for fixed ops and independent repair — a trusted partner that handles the background work so advisors, technicians, and owners can focus on the customer in front of them. It works alongside your existing tools, not instead of them.

Built by [Predii, Inc.](https://predii.com) — CONFIDENTIAL.

---

## Prerequisites

| Tool | Version | Needed for |
|------|---------|------------|
| Node.js | 24 | Everything. At `/opt/homebrew/opt/node@24/bin/node` if not on PATH. |
| MongoDB access | — | The API server (`172.16.80.7:27017`, see below) |
| Rust toolchain | stable | **Only** if you're building/running the Tauri desktop app (Surface B). Install via [rustup](https://rustup.rs): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh -s -- -y --profile minimal`, then `source "$HOME/.cargo/env"`. Not needed for any of the web surfaces. |
| Python 3 | 3.9+ | `ro-ner-demo/` — Predii Learn's live NER + Shop Profile backend, a packaged subset of the separate `ro-ner-demo` repo. One-time: `pip install -r ro-ner-demo/requirements.txt`. Not fatal if skipped — Predii Learn falls back to its persisted Shop Profile snapshot. |

> **Node path:** prefix commands with `PATH="/opt/homebrew/opt/node@24/bin:$PATH"` if `node`/`npm` is not found in your shell.

---

## Quick Start (web surfaces)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# 3. Start both the API server and Vite dev server together
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run dev:full

# — or separately, in two terminals —
PATH="/opt/homebrew/opt/node@24/bin:$PATH" node --env-file=.env.local server/index.js
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or any of the surfaces below).

### Production-style local run

```bash
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run build   # builds dist/
PATH="/opt/homebrew/opt/node@24/bin:$PATH" node server/index.js
```

A single server on `:3001` now serves both the API and every built surface — no separate Vite process. This is the same shape as the real deploy (see **Deploy** below).

---

## Surfaces

Six Vite entry points, all built from one `dist/` (see `vite.config.js`):

| Entry point | URL | Description |
|-------------|-----|-------------|
| `index.html` | `/` | WrenchIQ-AM — full persona-gateway app (advisor/tech/owner/customer) |
| `oem.html` | `/oem.html` | WrenchIQ-OEM — dealership portal |
| `am-3c.html` | `/am-3c.html` | WrenchIQ-AM — standalone 3C Story Writer |
| `admin.html` | `/admin.html` | Surface A — shop/OEM/3C/hierarchy admin console. Accepts `?section=<id>` to deep-link to a specific tab (`settings`, `amAdmin`, `oemSettings`, `am3cAdmin`, `hierarchy`) — see `src/WrenchIQAdminApp.jsx`. |
| `sms-representative.html` | `/sms-representative.html` | Surface C — stand-in for the shop's own SMS/DMS (RO Kanban + workflow screens), used so Surface B has something real to observe read-only |
| `sidecar.html` | `/sidecar.html` | Surface B — the WrenchIQ Intelligence sidecar, also packaged as the Tauri desktop app (below) |

---

## Tauri Desktop App (Surface B)

`sidecar.html` is also shipped as a native macOS desktop app via [Tauri v2](https://v2.tauri.app) — a narrow always-on-top window that watches the shop's live data feed and surfaces WrenchIQ intelligence without needing a browser tab open. The desktop shell (`src-tauri/`) is a thin wrapper: it loads the same `sidecar.html` bundle Vite already builds, plus two native plugins.

### Prerequisites

- Rust toolchain (see **Prerequisites** above) — `rustc`/`cargo` must be on `PATH` (`source "$HOME/.cargo/env"` after installing via rustup).
- `npm install` (pulls in `@tauri-apps/cli`, `@tauri-apps/api`, `@tauri-apps/plugin-notification`, `@tauri-apps/plugin-opener`).

### Run in dev mode

Tauri's `beforeDevCommand` is intentionally left empty (`src-tauri/tauri.conf.json`) — it does **not** start Vite for you. Start the Vite dev server yourself first, then run Tauri in a second terminal:

```bash
# terminal 1
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run dev

# terminal 2
source "$HOME/.cargo/env"
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run tauri:dev
```

First run compiles ~360 Rust crates (~25-40s); subsequent runs are incremental. A native "WrenchIQ Intelligence" window (420×720) opens once the build finishes and connects to `http://localhost:5173/sidecar.html`.

To just verify the Rust side compiles without launching a window (useful in a headless/CI environment):

```bash
source "$HOME/.cargo/env"
cd src-tauri && cargo check
```

### Build a release binary

```bash
source "$HOME/.cargo/env"
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npm run tauri:build
```

Produces a `.app`/`.dmg` under `src-tauri/target/release/bundle/` (targets configured in `tauri.conf.json`'s `bundle.targets`).

### What's wired up

| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-notification` | Native OS notifications for simulated shop activity while the window is minimized (`src/services/insightNotifier.js`) |
| `tauri-plugin-opener` | Lets the sidecar's settings gear icon launch Surface A (`/admin.html?section=settings&edition=am`) in the OS default browser — the packaged webview only ever loads `sidecar.html`, so plain `window.open` can't reach anything outside it. Detects Tauri via `"__TAURI_INTERNALS__" in window` and falls back to plain `window.open` when the same code runs in a normal browser tab (dev/test). |

Capabilities are declared in `src-tauri/capabilities/default.json` (`core:default`, `notification:default`, `opener:default`) — add new permissions there if you wire up another plugin. `VITE_WEB_APP_BASE_URL` (see **Environment Variables**) tells the Sidecar where Surface A actually lives, since the desktop shell has no other concept of the web app's root origin.

### Known limitations

- No local data-feed cache or auth relay yet — the WebView calls the hosted API directly (`VITE_API_BASE`), same as the web build. See `src-tauri/README.md` for the planned follow-on.
- Only a macOS target is configured today (`tauri.conf.json`'s `bundle.targets`).

---

## Architecture

### Persona gateway

`WrenchIQApp.jsx` → `PersonaGatewayScreen.jsx` → persona selection → `PersonaShell.jsx` (nav + AI panel).

**AM personas:** `advisor`, `tech`, `owner`, `customer`, `advisorLite`
**OEM personas:** `fixedOps`, `oemAdvisor`, `oemTech`

Persona gear icons deep-link to `/admin.html?section=<id>` (see **Surfaces** above) instead of rendering settings inline.

### AI panel — WrenchIQ Intelligence

`src/components/WrenchIQAgent.jsx` — fixed right panel, context-aware per screen. Also home to the retrospective ("retro-mode") conversational goal-setting flow and the always-visible Strategic Priorities / service-recommendations widgets.

### RO Advisor Agent

A tool-calling LLM agent (`server/services/roAdvisorService.js`) that fires every time an advisor selects a repair order — this is what powers the Sidecar (Surface B). It consults three data sources in parallel via OpenAI-format tool calls:

| Tool | Source |
|------|--------|
| `get_customer_history` | `RepairOrder` + `wrenchiq_ro` collections (up to 8 most recent visits) |
| `get_shop_objectives` | `tribal_notes` collection (Strategic Priorities / advisor reminders), resolved up a shop's district/region ancestor chain via `location_hierarchy` |
| `get_mileage_services` | Domain knowledge — standard maintenance intervals by make/model/mileage |

`POST /api/ro-advisor` composes the LLM output with two deterministic (non-LLM) calculations before responding:

- **`marginCheck`** (`server/services/marginCheck.js`) — per-RO labor/parts margin vs. the shop's `shop_config`, classified `on-target` / `at-risk` / `below-target`.
- **`aroGap`** — current RO total vs. the shop's ARO target (`shop_goals`, metric `avg_ro`), and how much of the gap the recommendations would close.

Full response shape: `advisorBrief`, `serviceRecommendations[]` (talk tracks + estimated cost), `ings[]` (Strategic Priorities — note/applies/reason), `alerts[]`, `marginCheck`, `aroGap`.

Set `LLM_SKIP_TOOLS=true` to bypass tool calling and use a single-pass prompt with pre-injected data (for LLM servers that don't support `tool_calls`).

### Location Hierarchy

`server/routes/hierarchy.js` + `src/screens/HierarchyAdminScreen.jsx` (at `/admin.html?section=hierarchy`) model a region → district → shop tree over the two real demo shops (`cornerstone`, `ridgeline`) — not the synthetic 100-location dataset in `MultiLocationScreen.jsx`. A Strategic Priority authored at district or region level (via the "Scope" selector on Settings' Strategic Priorities tab) applies to every shop underneath it, resolved through `get_shop_objectives` above.

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
| `tribal_notes` | varies | Strategic Priorities / advisor reminders, scoped by `shopId` (a real shop id, or a `location_hierarchy` district/region id) |
| `location_hierarchy` | small | Region → district → shop tree (auto-seeded on first `GET /api/hierarchy`) |
| `shop_config` | one per shop | Margin calculation variables — labor cost, parts margin target, preferred suppliers (auto-seeded on first `GET /api/shop-config/:shopId`) |
| `shop_goals` | varies | Shop objectives/targets (e.g. ARO target, metric `avg_ro`), keyed by shop or the network-aggregate sentinel `shop-001` |
| `shop_snapshot_90d` | one per shop/location | Cached 90-day shop snapshot (15-min TTL) backing the retro-mode goal-setting flow |
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
bin/seed-locations          # seed 90-day RO data for the 4-location demo shop
bin/demo-ready              # pre-demo environment prep for both real shops (cornerstone/ridgeline)
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
  start-demo      Start everything (ro-ner-demo + backend + Vite + Tauri Sidecar window)
  stop-demo       Stop everything start-demo started
  server          Start the WrenchIQ API server (port $API_PORT, default 3001)
  tauri-app       Start/stop just the Tauri Sidecar app + its dev servers
  ro-ner-demo     Start the packaged ro-ner-demo service (port $RO_NER_PORT, default 8090)
  package         Build + package a versioned release tarball
  deploy          Build → package → deploy to wrenchiq-demo in one step
  seed-batch      Seed a batch of demo repair orders into MongoDB
  seed-list       Print all batches and customer rosters
  seed-locations  Seed 90-day RO data for the 4-location demo shop
  seed-demo-story Seed a single story RO for the 3C Story Writer demo
  demo-ready      Pre-demo environment prep (both real shops, or --shop taylor|brad)
  import-prod     Import from the production source Mongo host
  export-db       Export the current wrenchiq database
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

Deploy target: `wrenchiq-demo` SSH host (`172.16.40.19`), path `/opt/predii/wrenchiq`. Requires an SSH alias named `wrenchiq-demo` in `~/.ssh/config`.

```bash
# One-step
bin/deploy                # build → package → deploy
bin/deploy --no-build      # skip Vite build, use existing dist/
bin/deploy --no-package    # redeploy the latest tarball as-is

# Or manually
bin/package
scp releases/wrenchiq-deploy-latest.tar.gz releases/deploy-remote.sh wrenchiq-demo:~/Downloads/
ssh wrenchiq-demo 'bash ~/Downloads/deploy-remote.sh'
```

The deploy script:
- Extracts the tarball to `/opt/predii/wrenchiq`
- Preserves the existing `.env.local` (never overwrites)
- Runs `npm install --omit=dev`
- Stops any running server and starts a fresh one
- Logs to `/tmp/wrenchiq-server.log`

After first deploy, manually add new env vars to `/opt/predii/wrenchiq/.env.local` via SSH if they were not in the original `.env.local` (e.g. `VITE_WEB_APP_BASE_URL` — see below).

The Tauri desktop app is **not** part of this deploy flow — it's built and distributed separately (`npm run tauri:build`), pointed at whichever `VITE_WEB_APP_BASE_URL` the shop should reach.

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
| GET/POST/PATCH | `/api/repair-orders/*` | RO CRUD, active queue, story-RO detail (`/api/repair-orders/story-ro/:roId`) |
| GET/POST | `/api/knowledge-graph` | Knowledge graph queries |
| POST | `/api/knowledge-graph/ask` | Chat with the knowledge graph (LLM) |
| * | `/api/agent/*` | Legacy agent routes |
| * | `/api/ro-agent/*` | Inbound social/SMS lead triage → draft RO |
| POST | `/api/ro-advisor` | RO Advisor Agent — service recommendations, Strategic Priorities, alerts, margin check, ARO gap (see **Architecture** above) |
| * | `/api/aro-agent/*` | Shop-wide ARO/goal/trend/tech analytics (network aggregate, read-only) |
| * | `/api/demo/*` | Demo RO fixtures |
| POST | `/api/claude` | Claude proxy (client-side LLM calls) |
| GET/POST | `/api/snapshot/90d/:shopId[/:locationId]`, `/api/snapshot/refresh` | 90-day shop snapshot (15-min MongoDB cache) |
| GET/POST/DELETE | `/api/shop-goals[/:shopId]` | Shop objectives/targets (max 4 per shop) |
| GET/PATCH | `/api/shop-config/:shopId` | Margin calculation variables (auto-seeds defaults) |
| GET/POST/PATCH/DELETE | `/api/tribal-notes[/:shopId\|:id]` | Strategic Priorities / advisor reminders |
| GET/POST/PATCH/DELETE | `/api/hierarchy[/:id]` | Region/district/shop tree (auto-seeds on first read) |
| GET | `/api/customers` | Customer list |
| POST | `/api/auth/log` | Record login attempt |
| GET | `/api/auth/activity` | Recent login activity |
| GET | `/api/llm-log` | LLM call log (model, tokens, duration) |
| GET | `/api/data-feed/*` | Live data-feed polling (customers, most-recent-customer) — backs Surface B/C's `CustomerSelector` |
| GET | `/api/recommendations` | AI shop recommendations (15-min MongoDB cache) |

### POST /api/ro-advisor

```bash
curl -s -X POST http://localhost:3001/api/ro-advisor \
  -H "Content-Type: application/json" \
  -d '{
    "ro":       { "customerName": "Brenda Okafor", "customerId": "cust-003",
                  "serviceType": "Emissions Diagnostic", "dtcs": ["P0420"],
                  "services": [{ "laborCost": 140, "partsCost": 0, "laborHrs": 0.8 }],
                  "totalEstimate": 140 },
    "customer": { "id": "cust-003" },
    "vehicle":  { "year": 2020, "make": "Toyota", "model": "Camry", "mileage": 67000 },
    "shopId":   "cornerstone"
  }'
```

Returns `{ advisorBrief, serviceRecommendations[], ings[], alerts[], marginCheck, aroGap, generatedAt, dataSourced }`.

### GET /api/hierarchy

```bash
curl -s http://localhost:3001/api/hierarchy
# [{id: "region-west", type: "region", ...}, {id: "district-bayarea", type: "district", parentId: "region-west", ...},
#  {id: "cornerstone", type: "shop", parentId: "district-bayarea", ...}, {id: "ridgeline", ...}]
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

# Origin where Surface A (the web admin app) is reachable — used by the Tauri
# Sidecar's settings gear icon to open /admin.html in the OS browser, since the
# desktop shell has no other concept of the web app's root. Defaults to the
# Vite dev server; set to the real deployed origin for a packaged build.
VITE_WEB_APP_BASE_URL=http://localhost:5173

# LLM — generic (takes priority over Azure vars)
LLM_BASE_URL=http://192.222.55.177:8081/v1   # vLLM or any OpenAI-compatible endpoint
LLM_API_KEY=                                  # leave empty for local servers
LLM_MODEL=gpt-4o-mini
LLM_SKIP_TOOLS=false                          # set true if server doesn't support tool_calls

# LLM — browser-side (Vite, used for ing entity extraction)
VITE_LLM_BASE_URL=
VITE_LLM_API_KEY=
VITE_LLM_MODEL=gpt-4o-mini

# Claude / Anthropic (optional — used for 3C Story Writer browser-side calls,
# and as the server-side LLM fallback when LLM_BASE_URL is not set)
VITE_ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_API_KEY=sk-ant-...
```

### LLM fallback chain

Server: `LLM_BASE_URL` → `AZURE_OPENAI_API_BASE` → hardcoded Azure default (`server/config.js`)
Browser: `VITE_LLM_BASE_URL` → `VITE_ANTHROPIC_API_KEY` → server proxy (`/api/claude`)

---

## Versioning

`version.json` tracks `{ major, minor }`. `bin/package` increments minor (rolls to next major at 10).

Version and build date are injected at build time as `__APP_VERSION__` and `__APP_BUILT__` — consumed by `src/hooks/useAppVersion.js` and displayed in the login screen and footers.

---

## Tech Stack

- **Frontend:** React 19, Vite 6, Recharts, Lucide React
- **Backend:** Node.js 24, Express 5, MongoDB 7
- **Desktop:** Tauri v2 (Rust) — wraps the Sidecar web build as a native macOS app
- **AI:** OpenAI-compatible tool-calling agent (Azure OpenAI / vLLM), Anthropic Claude (3C pipeline)
- **Build:** Multi-entry Vite (`main` / `oem` / `am3c` / `admin` / `smsRepresentative` / `sidecar`)

---

*PREDII CONFIDENTIAL — © 2026 Predii, Inc.*
