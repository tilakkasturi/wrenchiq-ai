# ro-ner-demo (packaged subset)

This is a minimal, deployable slice of Predii's `ro-ner-demo` repo
(`git@bitbucket.org:predii/ro-ner-demo.git`), packaged here so the WrenchIQ
next-gen demo doesn't depend on a separate, undocumented process running on
whoever's laptop happens to be driving it.

It exists to serve exactly the three endpoints `server/services/roNerService.js`
proxies (`RO_NER_BASE_URL`, see the main repo's `.env.example`):

- `GET /api/health`
- `GET /api/shop_profile`
- `POST /api/batch/stream`

## What's included vs. left out

The full `ro-ner-demo` repo is several GB (NER benchmarking corpora, synthetic
data generators, backup taxonomy dumps) — almost none of which the endpoints
above touch. This package keeps only:

- `ner_server.py`, `ner_prompt.py`, `ner_symptom_cache.py`, `sme_store.py` — the
  actual FastAPI service (`ner_pipeline.py`, the standalone benchmarking CLI, is
  not imported by the server and isn't included).
- `ner_config.yaml` — endpoints (Mongo, LLM) are fixed/shared with the rest of
  this demo stack — see below.
- `datasources/cornerstone/` (~2MB) — the one datasource WrenchIQ's "Cornerstone
  Auto Group" shop actually uses. The other datasources (`ro-m`, `synthetic`,
  `cd`, `ro-m-predii-examples`) are absent; `ner_server.py` logs and skips them
  gracefully at startup rather than failing.
- `resources/component.taxonomy` (16MB) — used for component-name matching;
  the tool degrades gracefully (empty index) if this were ever missing.
- `prompts/`, `sme_feedback/` — small, needed by the server as-is.
- `ner_app.html` — the NER benchmarking UI, served at `/`. Not used by
  WrenchIQ's proxy, but harmless to keep so this is still a fully working
  `ro-ner-demo` instance on its own.

Left out entirely: `datasources.zip`, `ri-100m.zip`, `datasources/synthetic`,
`datasources/ro-m*`, `datasources/cd`, `resources/backup/`, the
`build_shop_synthetic.py`/`make_*_demo.py` data-generation scripts, and the
`.git` history. If you need to *regenerate* the cornerstone dataset (not just
serve it), do that from the full `ro-ner-demo` repo and re-copy
`datasources/cornerstone/` here.

## Config

Mongo and LLM endpoints are Predii-internal and fixed across this whole demo
stack (same hosts the main repo's `.env.local` points at) — `ner_config.yaml`
ships with the same defaults. They're still overridable via env vars if ever
needed, matching next-gen's own convention:

```bash
MONGODB_URI=...      # overrides mongo.uri
MONGODB_DB=...       # overrides mongo.db
LLM_BASE_URL=...     # overrides endpoints.llm.base_url
LLM_MODEL=...        # overrides endpoints.llm.model
RO_NER_PORT=8090     # default; matches next-gen's RO_NER_BASE_URL default
```

## Run

```bash
pip install -r requirements.txt
python3 ner_server.py
```

Serves on `http://localhost:8090`. See `bin/ro-ner-demo` in the parent repo for
the wrapper `bin/start-demo` uses.

## Fix applied here vs. upstream

`_mongo_ro_to_shop_ro`/`_mongo_ro_to_sample` read `dateIn` straight off the
WrenchIQ Mongo `RepairOrder` doc with no validation. A record with a
missing/null `dateIn` crashed `/api/shop_profile` entirely (`datetime.fromisoformat`
on `None`) — not just for that one record, for the whole endpoint, for every
shop. Fixed here by validating each Mongo-sourced RO's `check_in_ts` at the
merge point in `load_mongo_cornerstone()` and dropping (with a startup log
line) any that don't parse, instead of letting one bad WrenchIQ record take
down Shop Profile for everyone. Worth upstreaming to the real `ro-ner-demo`
repo — not done here since this package intentionally doesn't carry that
repo's git history.
