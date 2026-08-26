#!/bin/bash
#
# build/package.sh — produce the ready-to-deploy WrenchIQ artifact.
#
# Usage:
#   ./build/package.sh wrenchiq
#
# Output:
#   bin/<module>.tar.gz   the artifact the BUILD step publishes, uploaded by
#                         build/deploy.sh and unpacked into /app by the
#                         k8s-configs Dockerfile.
#
# What goes in (nothing else):
#   dist/            built frontend — all six Vite entry points
#   server/          the Node API; also serves dist/ with an SPA fallback
#   src/data/        NOT frontend-only — server/routes/customers.js and
#                    server/services/roAdvisorService.js import demoData.js
#                    and tsbData.js from here, so the API breaks without it
#   ro-ner-demo/     Predii Learn's FastAPI service (runs alongside Node)
#   package.json + package-lock.json   for `npm ci --omit=dev` in the image
#   version.json, .env.example
#
# Deliberately excluded: node_modules, sources (src/ except data), docs/,
# resources/, public/ (already inside dist/), src-tauri/ (the desktop app is
# not deployed), chrome-extension/, scripts/, test/, releases/, server.py.
#
# Runtime configuration is not this script's business — Mongo, LLM endpoint
# and keys are injected as env/secrets in the Deployment.
#
#   SKIP_TESTS=1   skip `npm test` (the repo's only automated gate)

set -euo pipefail

MODULE="${1:-wrenchiq}"
BUILD_HOME="bin"

# Repo root — the script lives in build/
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> Packaging ${MODULE}"
echo "    Node   : $(node --version)  (npm $(npm --version))"
echo ""

# ── Install dependencies ──────────────────────────────────────────────────────
# Full install, including devDependencies: vite and @vitejs/plugin-react are
# devDeps, so --omit=dev here would leave nothing to build with. The artifact
# ships no node_modules at all — the image runs its own `npm ci --omit=dev`.
#
# playwright is a devDependency whose postinstall downloads ~500MB of browsers
# that nothing in this repo uses. Skip it.
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
export CI=1

echo "==> Installing dependencies..."
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  echo "    (no package-lock.json — falling back to npm install)"
  npm install --no-audit --no-fund
fi
echo ""

# ── Tests ─────────────────────────────────────────────────────────────────────
# vitest is the repo's only automated gate (no linter, no typechecker). The
# suite is hermetic: test/setup.js scrubs OPENAI_*/AZURE_OPENAI_*/LangSmith
# vars and pins fetch to loopback, so it needs no VPN, Mongo, or LLM.
if [ "${SKIP_TESTS:-0}" != "1" ]; then
  echo "==> Running tests..."
  npm test
  echo ""
else
  echo "==> Tests skipped (SKIP_TESTS=1)"
  echo ""
fi

# ── Build the frontend ────────────────────────────────────────────────────────
# Intentionally no VITE_* here: unset means the bundle uses relative URLs, so
# it works at any host/IP and one artifact serves DEV/UAT/PROD. (Only the
# separate Tauri desktop build needs absolute values baked in.)
echo "==> Building frontend (vite build → dist/)"
rm -rf dist
npm run build

if [ ! -f dist/index.html ]; then
  echo "ERROR: vite build produced no dist/index.html." >&2
  exit 1
fi

# Every entry point must exist — a missing one means vite.config.js's
# rollupOptions.input lost a surface, which would 404 in production instead of
# failing the build.
for page in index oem am-3c admin sidecar sms-representative; do
  [ -f "dist/${page}.html" ] || { echo "ERROR: dist/${page}.html missing." >&2; exit 1; }
done
echo "    All six surfaces built."
echo ""

# ── Package ───────────────────────────────────────────────────────────────────
mkdir -p "$BUILD_HOME"
rm -f "${BUILD_HOME}/${MODULE}.tar.gz"

echo "==> Creating ${BUILD_HOME}/${MODULE}.tar.gz"
tar -czf "${BUILD_HOME}/${MODULE}.tar.gz" \
  --exclude='.env.local' \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='ro-ner-demo/ner_output/*' \
  --exclude='ro-ner-demo/ro' \
  --exclude='.DS_Store' \
  dist \
  server \
  src/data \
  ro-ner-demo \
  package.json \
  package-lock.json \
  version.json \
  .env.example

SIZE="$(du -h "${BUILD_HOME}/${MODULE}.tar.gz" | cut -f1)"

echo ""
echo "  ✓ ${BUILD_HOME}/${MODULE}.tar.gz  (${SIZE})"
echo ""
echo "  Contents:"
tar -tzf "${BUILD_HOME}/${MODULE}.tar.gz" \
  | awk -F/ '{print $1}' | sort -u | sed 's/^/    /'
echo ""
echo "  ${MODULE} package created"
