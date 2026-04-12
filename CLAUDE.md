# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Session Mode Config
- **Confluence spec hub:** https://predii.atlassian.net/wiki/spaces/prediiv2/pages/3897819137/NextGen+Project+Hub
- **Jira epic:** https://predii.atlassian.net/browse/AE-676
- **Working repo:** `/opt/predii/next-gen`

---

## Commands

```bash
# Dev (both servers in parallel — Vite :5173 + Express :3001)
npm run dev:full

# Frontend only
npm run dev

# API server only
bin/server

# Production build → dist/
npm run build                      # requires Node path: PATH="/opt/homebrew/opt/node@24/bin:$PATH"

# Package versioned release tarball (builds + increments version.json)
bin/package

# Package without rebuilding (script/config changes only)
bin/package --no-build

# Seed demo data into MongoDB
bin/seed-batch                     # batch 1 (default)
bin/seed-batch 2                   # batch 2
bin/seed-batch --reset             # drop collection, re-seed

# Health check
curl http://localhost:3001/api/health
```

**Node.js path:** Node is at `/opt/homebrew/opt/node@24/bin/node`. Prefix commands with `PATH="/opt/homebrew/opt/node@24/bin:$PATH"` if `node`/`npm` is not found in shell.

**Environment:** Copy `.env.example` → `.env.local`. Real MongoDB hosts: `172.16.80.7:27017` (dst) and `172.16.80.16:27017` (src). Always read from `.env.local`, not `.env`.

**Start server with env:** Use `node --env-file=.env.local server/index.js` (Node 20.6+) or `source .env.local && node server/index.js` for Node 18.

---

## Architecture

### Three editions / entry points

| HTML entry | React root | Description |
|---|---|---|
| `index.html` | `main.jsx` → `WrenchIQApp.jsx` | Full AM admin shell (original demo) |
| `oem.html` | `main.oem.jsx` → `WrenchIQOEMApp.jsx` | OEM dealership portal |
| `am-3c.html` | `main.am3c.jsx` → `WrenchIQAMApp.jsx` | Standalone 3C Story Writer |

### Persona gateway (primary user flow)

`WrenchIQApp.jsx` → `PersonaGatewayScreen.jsx` → user selects a persona → `PersonaShell.jsx` wraps the persona with nav + top bar + AI panel.

**AM personas:** `advisor`, `tech`, `owner`, `customer`, `advisorLite`
**OEM personas:** `fixedOps`, `oemAdvisor`, `oemTech`

`PersonaShell.jsx` renders a 3-column layout: left nav (60px) | screen content | WrenchIQ AI panel (300px, toggleable via AI button in top bar). Default visible for all non-tech personas.

### Screen routing

Each persona has a `PERSONA_NAV` config in `PersonaShell.jsx` mapping screen IDs to components. Navigation calls `onNavigate(screenId)` which is resolved in the parent app shell. Screen components live in `src/screens/`.

### AI panel (`WrenchIQAgent.jsx`)

Fixed right panel. Content is driven by `SCREEN_CONTEXT[activeScreen]` keyed by screen ID — this must be updated when adding new screens. Persona-specific fallbacks: `OWNER_CONTEXT`, `ADVISOR_CONTEXT`. Only renders recommendations when `RecommendationsContext` returns live data (no shimmer/empty state).

### AI Insights strip (`AIInsightsStrip.jsx`)

Horizontal scrollable strip injected at the top of most screen components. Each screen passes its own `insights` array — these are hardcoded per-screen, not from the API.

### Context providers

- `RecommendationsContext` — fetches `/api/recommendations`, falls back to `recommendationFallback.js` on 503
- `BrandingContext` — edition toggle (AM/OEM branding)

### Data sources (critical: keep in sync)

**Single source of truth for demo customers/ROs:** `src/data/demoData.js`
- `customers` — cust-001 to cust-009+ (Sarah Chen, David Kim, Monica Rodriguez, James Park, Angela Martinez, Robert Taylor, Tom Wallace, Priya Sharma…)
- `repairOrders` — RO-2024-xxxx series
- `SHOP` — Peninsula Precision Auto, Palo Alto

**Isolated 3C Story Writer data:** `src/data/am3cDemoRegistry.js` — uses different customers/ROs (Marcus Webb, Priya Nair, etc.) that do NOT match `demoData.js`. This is a known inconsistency.

**OEM data:** `src/data/oemDemoData.js`

### Backend (`server/`)

Express 5, MongoDB. All Claude/Anthropic settings in `server/config.js` — reads from env vars, never hardcode.

| File | Purpose |
|---|---|
| `server/index.js` | Express app, MongoDB connect |
| `server/config.js` | All Claude API settings (model, tokens, URL, key) |
| `server/routes/recommendations.js` | POST `/api/recommendations` — 15-min TTL cache in MongoDB |
| `server/routes/knowledgeGraph.js` | KG graph + `/api/knowledge-graph/ask` (Claude chat) |
| `server/routes/repairOrders.js` | CRUD for RepairOrder collection |
| `server/services/snapshotBuilder.js` | Builds shop snapshot for recommendation engine; auto-rebases stale demo RO dates to today |
| `server/services/recommendationLLM.js` | Calls Claude Haiku; strips meta-commentary and internal IDs from output |
| `server/services/recommendationFallback.js` | Client-side rule engine when API returns 503 |

### 3C Story Writer services (`src/services/am3c*`)

Pipeline: VIN decode → DTC lookup → TSB match → DVI → Assembly → Factuality check → Score → LLM narrative generation. Entry point is `am3cPipelineService.js`. LLM calls go through `am3cLLMService.js` using `VITE_ANTHROPIC_API_KEY` (browser-side).

### Versioning

`version.json` tracks `{ major, minor }`. `bin/package` increments minor up to 10 then bumps major. Version + build date are injected at build time via Vite `define` as `__APP_VERSION__` and `__APP_BUILT__` — consumed by `src/hooks/useAppVersion.js`. Displayed in login screen and all footers.

### Releases

```
releases/
  wrenchiq-deploy-YYYY-MM-DD-HHMM-vX.Y.tar.gz   # versioned tarballs
  wrenchiq-deploy-latest.tar.gz                   # symlink to latest
  deploy-remote.sh                                # deployment script
```

Deploy target: `wrenchiq-demo` SSH host (172.16.40.19), path `/opt/predii/wrenchiq`.

---

## Import/Normalization Script Sync

Whenever you modify `src/data/demoData.js` or `server/routes/`, also update all four scripts:

| Script | What to keep in sync |
|---|---|
| `scripts/lib/vehicleNormalizer.js` | `vehicleOrigin()` make classification sets |
| `scripts/importFromProd.js` | TECHNICIANS, service line fields, laborTimeTracking, vehicleOrigin |
| `scripts/importRepairOrders.js` | TECH_EFFICIENCY map, actual_labor_hours, vehicle_origin |
| `scripts/seedRepairOrders.js` | SHOP targetElr, TECHNICIANS efficiency, clock fields, laborTimeTracking |

Key schema fields that must stay consistent: `laborHrs`/`actualHrs`, `clockIn`/`clockOut`, `laborTimeTracking: { totalFlatHrs, totalActualHrs, elr, postedRate }`, `vehicleOrigin: JAPANESE|GERMAN|DOMESTIC_US|OTHER`, `efficiency` on every technician.
