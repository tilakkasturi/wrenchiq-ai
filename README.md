# WrenchIQ

**"The Dealership's Intelligence. The Neighborhood's Trust."**

Cloud-native, AI-native shop management system for independent auto repair shops.
Built by [Predii, Inc.](https://predii.com) — CONFIDENTIAL.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# edit .env.local with your MongoDB URI

# 3. Seed the database (batch 1)
bin/seed-batch

# 4. Start the API server + Vite dev server
npm run dev:full
```

Open [http://localhost:5173](http://localhost:5173)

---

## Editions

| Entry point | URL | Description |
|-------------|-----|-------------|
| `index.html` | `/` | WrenchIQ — Aftermarket (AM) full shop management |
| `oem.html` | `/oem.html` | WrenchIQ — OEM dealership portal |
| `am-3c.html` | `/am-3c.html` | WrenchIQ AM — 3C Story Writer |

---

## MongoDB Database

**Database:** `wrenchiq`
**Collection:** `RepairOrder`

### Schema — RepairOrder

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | RO number, e.g. `RO-2024-1042` |
| `status` | String | Workflow: `open` \| `estimate` \| `approved` \| `closed` |
| `kanbanStatus` | String | Board column: `checked_in` \| `inspecting` \| `estimate_sent` \| `approved` \| `in_progress` \| `ready` |
| `customerName` | String | Full name |
| `customerPhone` | String | Contact phone |
| `customerEmail` | String | Contact email |
| `vin` | String | 17-char VIN |
| `year` / `make` / `model` / `trim` | String/Number | Vehicle info |
| `mileageIn` / `mileageOut` | Number | Per-visit odometer |
| `services` | Array | Service lines (4–9 per RO) |
| `totalEstimate` / `totalLabor` / `totalParts` | Number | Financials |
| `dateIn` / `promisedDate` / `closedDate` | ISO String | Timestamps |
| `batchNumber` | Number | Which seed batch created this RO |

---

## Seed Data

### Overview

100 Repair Orders per batch, 25 unique customers per batch, spread across 3 years (2023–2026).
Each RO has 4–9 realistic service lines.

### Batch Summary

| Batch | Customers | ROs | Profiles |
|-------|-----------|-----|---------|
| 1 | 1–25 | 100 | Palo Alto — tech workers, professors, attorneys |
| 2 | 26–50 | 100 | SF/South Bay — Uber, Airbnb, Stripe, Waymo engineers |
| 3 | 51–75 | 100 | Tradespeople, medical workers, local businesses |
| 4 | 76–100 | 100 | Executives, academics, specialty vehicles |

### RO Status Distribution (per batch)

| Status | Kanban Column | Approx count |
|--------|--------------|-------------|
| `open` | Checked In / Inspecting | ~2 |
| `estimate` | Estimate Sent | ~6 |
| `approved` | Approved / In Progress | ~7 |
| `closed` | Ready (historical) | ~85 |

---

## bin/ Scripts

```
bin/
  seed-batch      Seed a batch of 25 customers into MongoDB
  seed-list       Print all batches and customer rosters
  import-prod     One-time import from production backup
  server          Start the WrenchIQ API server
```

### `bin/seed-batch`

Seeds 100 Repair Orders for one batch of 25 customers.
**Appends** to the existing collection — existing data is never touched.

```bash
bin/seed-batch              # batch 1 — customers 1-25 (default)
bin/seed-batch 2            # batch 2 — customers 26-50
bin/seed-batch 3            # batch 3 — customers 51-75
bin/seed-batch 4            # batch 4 — customers 76-100
bin/seed-batch --reset      # drop collection, re-seed batch 1
bin/seed-batch 2 --reset    # drop collection, seed batch 2
```

### `bin/seed-list`

Prints every customer across all batches with visit counts and occupations.

```bash
bin/seed-list
```

### `bin/import-prod`

One-time import from the production backup database.
Scans 50,000 real line items from `repair_smith_prod-PDRMS-Cluster-Production-Backup`,
groups into ROs with 4+ lines, samples 100, and writes them into `wrenchiq.RepairOrder`.

```bash
bin/import-prod
```

> Drops and recreates the `RepairOrder` collection each run.

### `bin/server`

Starts the Express API server that the Vite frontend proxies to.

```bash
bin/server         # listens on $API_PORT (default 3001)
```

---

## npm Scripts

```bash
npm run dev          # Vite dev server only (port 5173)
npm run server       # API server only (port 3001)
npm run dev:full     # Both in parallel (requires concurrently)
npm run build        # Production build → dist/

npm run seed         # Seed batch 1
npm run seed:batch 2 # Seed a specific batch
npm run seed:list    # List all batches
npm run import       # Import from production backup
```

---

## API Endpoints

Base URL: `http://localhost:3001` (proxied from Vite at `/api`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/repair-orders` | List ROs (filterable) |
| GET | `/api/repair-orders/active` | Active queue (open/estimate/approved) |
| GET | `/api/repair-orders/:id` | Single RO |
| PATCH | `/api/repair-orders/:id/status` | Update workflow status |

**Query params for GET /api/repair-orders:**
- `status` — `open` \| `estimate` \| `approved` \| `closed`
- `kanbanStatus` — e.g. `checked_in`, `estimate_sent`
- `customerId` — e.g. `cust-001`
- `vin` — partial match
- `limit` / `skip` — pagination (default limit 200)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
MONGODB_URI=mongodb://172.16.80.7:27017   # or Atlas URI
MONGODB_DB=wrenchiq
API_PORT=3001
VITE_API_BASE=http://localhost:3001
```

---

## Tech Stack

- **Frontend:** React 19, Vite 6, Recharts, Lucide React
- **Backend:** Node.js, Express 5, MongoDB 7
- **Build:** Multi-entry Vite (main / oem / am-3c)

---

*PREDII CONFIDENTIAL — © 2026 Predii, Inc.*
