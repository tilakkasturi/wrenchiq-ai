#!/bin/bash
# WrenchIQ — Remote Deploy Script
# Run from ~/Downloads on the target server:
#   bash ~/Downloads/deploy-remote.sh

set -e

DEPLOY_DIR="/opt/predii/wrenchiq"
TARBALL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/wrenchiq-deploy.tar.gz"

VERSION=$(tar -tzf "$TARBALL" --include="*/version.json" 2>/dev/null | head -1 | xargs -I{} tar -xzOf "$TARBALL" {} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('version','unknown'))" 2>/dev/null || echo "unknown")

echo "==> WrenchIQ Deployment"
echo "    Version : $VERSION"
echo "    Tarball : $TARBALL"
echo "    Target  : $DEPLOY_DIR"
echo ""

# ── Verify tarball exists ─────────────────────────────────────
if [ ! -f "$TARBALL" ]; then
  echo "ERROR: wrenchiq-deploy.tar.gz not found in $(dirname "$TARBALL")"
  exit 1
fi

# ── Create deploy directory ───────────────────────────────────
sudo mkdir -p "$DEPLOY_DIR"
sudo chown "$USER:$USER" "$DEPLOY_DIR"

# ── Extract ───────────────────────────────────────────────────
echo "==> Extracting..."
tar -xzf "$TARBALL" -C "$DEPLOY_DIR" --strip-components=0

# ── Config setup ──────────────────────────────────────────────
if [ ! -f "$DEPLOY_DIR/.env.local" ]; then
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env.local"
  echo ""
  echo "  ⚠  .env.local created from .env.example."
  echo "     Edit $DEPLOY_DIR/.env.local and set:"
  echo "       ANTHROPIC_API_KEY=sk-ant-..."
  echo "       MONGODB_URI=mongodb://<host>:27017"
  echo "       MONGODB_DB=wrenchiq"
  echo "       VITE_API_BASE=http://<this-server>:3001"
  echo ""
else
  echo "==> .env.local already exists — keeping current config."
fi

# ── Install Node dependencies ─────────────────────────────────
echo "==> Installing dependencies..."
cd "$DEPLOY_DIR"
npm install --omit=dev --silent

# ── Stop existing server if running ──────────────────────────
if pgrep -f "node.*server/index" > /dev/null 2>&1; then
  echo "==> Stopping existing server..."
  pkill -f "node.*server/index" || true
  sleep 1
fi

# ── Start server ──────────────────────────────────────────────
echo "==> Starting WrenchIQ API server..."
# Load .env.local manually (--env-file requires Node 20.6+)
set -o allexport
# shellcheck disable=SC1091
source .env.local
set +o allexport
nohup node server/index.js > /tmp/wrenchiq-server.log 2>&1 &
SERVER_PID=$!

sleep 2

if kill -0 "$SERVER_PID" 2>/dev/null; then
  PORT=$(grep "API_PORT" .env.local 2>/dev/null | cut -d= -f2 | tr -d ' ' || echo "3001")
  echo ""
  echo "  ✓ Server running (PID $SERVER_PID)"
  echo "  ✓ API : http://localhost:${PORT:-3001}/api/health"
  echo "  ✓ Logs: tail -f /tmp/wrenchiq-server.log"
  echo "  ✓ UI  : serve $DEPLOY_DIR/dist/ with nginx or any static server"
  echo ""
else
  echo "ERROR: Server failed to start. Check /tmp/wrenchiq-server.log"
  cat /tmp/wrenchiq-server.log
  exit 1
fi
