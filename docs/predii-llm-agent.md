# PrediiLLMAgent — Specification

## Overview

PrediiLLMAgent is a lightweight agentic gateway microservice that exposes OpenAI-compatible HTTP endpoints for external client applications (starting with **openclaw**) and proxies their requests to the internal **PrediiLLM** inference service (`/v1/chat/completions`). It replicates the PrediiLLM configuration pattern used by Predii360, adds per-client routing logic, and bridges API contract differences between clients and PrediiLLM.

---

## Problem Statement

PrediiLLM is an internal inference service consumed directly by Predii360. Agentic applications like **openclaw** need to reach PrediiLLM but expect an **OpenAI-compatible vLLM-style API** (`/v1/models`, `/v1/chat/completions`). PrediiLLM is not directly internet-accessible and its API surface includes extra non-standard fields. A dedicated gateway microservice — PrediiLLMAgent — is needed to:

1. Expose per-client endpoints with the contract each client expects
2. Translate client requests into PrediiLLM's expected payload
3. Authenticate and authorize inbound client requests
4. Centralize PrediiLLM connection configuration (mirroring Predii360's config pattern)

---

## Architecture

```
openclaw                     PrediiLLMAgent              PrediiLLM
---------                    ---------------             ----------
vLLM provider config  ──────►  /openclaw/v1/models  ──────► (model list from config)
POST /chat/completions ──────►  /openclaw/v1/chat/   ──────► POST /v1/chat/completions
                               completions
                               (bearer auth,
                                field mapping)

Future clients
(client-n)            ──────►  /{client}/v1/...      ──────► PrediiLLM
```

---

## Configuration

PrediiLLMAgent adopts the same YAML configuration structure as Predii360, reading from `$PREDII_HOME/conf/application.yaml`.

### application.yaml — PrediiLLMAgent block

```yaml
predii:
  llm:
    agent:
      host: 0.0.0.0
      port: 9095

    # Mirror of Predii360's prediillm block — single source of truth for the
    # PrediiLLM connection.
    prediillm:
      generate:
        ip: http://192.222.55.152    # production: <HOST> placeholder
        port: 9090                   # production: 8081
        model: llama3.2
        max_tokens: 1024
        temperature: 0
        max_input_tokens: 4096
        add_special_tokens: false
        encoding_format: json
        top_p: 1.0
        top_k: 1
        add_generation_prompt: true

    # Per-client authentication tokens (plaintext or Azure Key Vault references)
    clients:
      openclaw:
        api_key: "${OPENCLAW_AGENT_API_KEY}"   # bearer token openclaw sends
```

**Environment variables:**
| Variable | Purpose |
|---|---|
| `PREDII_HOME` | Root of the application directory (same as Predii360) |
| `OPENCLAW_AGENT_API_KEY` | Bearer token openclaw presents; can be set as `PREDII_SECRET_OPENCLAW_AGENT_API_KEY` for Key Vault resolution |
| `PREDIILLM_HOST` | Override PrediiLLM host at runtime |
| `PREDIILLM_PORT` | Override PrediiLLM port at runtime |

---

## Server

- Framework: **FastAPI** + Gunicorn / UvicornH11Worker (consistent with Predii360)
- Default port: **9095**
- Startup command:

```bash
gunicorn --workers=4 -k uvicorn.workers.UvicornH11Worker --timeout 120 \
  --bind 0.0.0.0:9095 llmagent.microservice.fastapp:application
```

---

## API Endpoints

### Health

```
GET /health
GET /api/health
```

Response:
```json
{ "status": "ok", "prediillm": "reachable" | "unreachable" }
```

`/api/health` additionally probes `GET {prediillm.ip}:{prediillm.port}/health`.

---

### openclaw — vLLM-compatible Endpoints

openclaw configures its vLLM provider with:

```json
{
  "models": {
    "providers": {
      "vllm": {
        "baseUrl": "http://<agent-host>:9095/openclaw/v1",
        "apiKey": "<OPENCLAW_AGENT_API_KEY>"
      }
    }
  }
}
```

#### Model Discovery

```
GET /openclaw/v1/models
Authorization: Bearer <OPENCLAW_AGENT_API_KEY>
```

Response (OpenAI format — built from config, no live PrediiLLM call required):

```json
{
  "object": "list",
  "data": [
    {
      "id": "llama3.2",
      "object": "model",
      "owned_by": "prediillm"
    }
  ]
}
```

#### Chat Completions

```
POST /openclaw/v1/chat/completions
Authorization: Bearer <OPENCLAW_AGENT_API_KEY>
Content-Type: application/json
```

**Request body (openclaw / OpenAI format):**
```json
{
  "model": "llama3.2",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user",   "content": "..." }
  ],
  "stream": false,
  "max_tokens": 1024,
  "temperature": 0
}
```

**Field mapping — openclaw → PrediiLLM:**

| openclaw field | PrediiLLM field | Notes |
|---|---|---|
| `model` | `model` | pass-through |
| `messages` | `messages` | pass-through |
| `stream` | `stream` | pass-through |
| `max_tokens` | `max_tokens` | falls back to config default if absent |
| `temperature` | `temperature` | falls back to config default |
| _(absent)_ | `top_p` | injected from config |
| _(absent)_ | `top_k` | injected from config |
| _(absent)_ | `add_generation_prompt` | injected from config |
| _(absent)_ | `encoding_format` | injected from config |
| _(absent)_ | `max_input_tokens` | injected from config |
| _(absent)_ | `add_special_tokens` | injected from config |
| _(generated)_ | `request_id` | 8-char random alphanumeric, generated per request |

**PrediiLLM upstream call:**
```
POST {prediillm.ip}:{prediillm.port}/v1/chat/completions
Content-Type: application/json
(no auth header — internal network)
```

**Response:** PrediiLLM response is forwarded verbatim to openclaw. PrediiLLM returns an OpenAI-compatible response object; no transformation needed.

**Streaming:** When `stream: true`, PrediiLLM SSE chunks are proxied directly to the client as `text/event-stream`.

---

## Authentication & Authorization

| Actor | Mechanism |
|---|---|
| openclaw → PrediiLLMAgent | `Authorization: Bearer <OPENCLAW_AGENT_API_KEY>` (validated against `clients.openclaw.api_key` in config) |
| PrediiLLMAgent → PrediiLLM | No auth — internal network (same as Predii360) |

If the bearer token is missing or incorrect, return `401 Unauthorized`:
```json
{ "detail": "Invalid or missing API key" }
```

---

## Error Handling

| Scenario | Response |
|---|---|
| Missing / invalid bearer token | `401 Unauthorized` |
| PrediiLLM unreachable | `502 Bad Gateway` with `{ "detail": "PrediiLLM upstream error: <message>" }` |
| PrediiLLM timeout | `504 Gateway Timeout` |
| Invalid request body | `422 Unprocessable Entity` (FastAPI default) |

---

## Project Structure

```
llmagent/
├── microservice/
│   └── fastapp.py          # FastAPI app, route registration, startup
├── config/
│   └── config_loader.py    # Mirrors p360's ConfigLoader — reads application.yaml
├── clients/
│   └── openclaw/
│       ├── router.py       # /openclaw/v1/* routes
│       └── mapper.py       # openclaw → PrediiLLM field mapping
└── tasks/
    └── prediillm.py        # HTTP client for PrediiLLM (mirrors p360's PrediiLLM class)
```

---

## Deployment

### setenv.sh (mirrors Predii360 pattern)

```bash
export PREDII_HOME="<DEPLOY_DIR>/application"
export OPENCLAW_AGENT_API_KEY="<secret>"
```

### application.yaml (production template)

```yaml
predii:
  llm:
    agent:
      host: 0.0.0.0
      port: 9095
    prediillm:
      generate:
        ip: http://<HOST>
        port: 8081
        model: llama3.2
        max_tokens: 1024
        temperature: 0
        max_input_tokens: 4096
        add_special_tokens: false
        encoding_format: json
        top_p: 1.0
        top_k: 1
        add_generation_prompt: true
    clients:
      openclaw:
        api_key: "${OPENCLAW_AGENT_API_KEY}"
```

---

## openclaw Integration Setup

In openclaw's config:

```json
{
  "models": {
    "providers": {
      "vllm": {
        "baseUrl": "http://<predii-llm-agent-host>:9095/openclaw/v1",
        "apiKey": "<OPENCLAW_AGENT_API_KEY>",
        "api": "openai-completions"
      }
    }
  }
}
```

Or via environment variable auto-discovery:

```bash
VLLM_API_KEY=<OPENCLAW_AGENT_API_KEY>
# set baseUrl override in openclaw config to point to PrediiLLMAgent
```

---

## Future Clients

Each new client microservice gets:
- A dedicated route prefix: `/{client}/v1/...`
- Its own `api_key` entry under `clients` in config
- A `clients/{client}/router.py` and `clients/{client}/mapper.py` implementing the client's expected API contract

---

## Dependencies

- Python 3.10+
- `fastapi`, `uvicorn`, `gunicorn`
- `httpx` (async HTTP client for PrediiLLM upstream calls)
- `pyyaml` (config loading)
- Mirrors p360's `llm/config/config_loader.py` pattern for secret resolution (Azure Key Vault + env vars)
