#!/bin/bash
# WrenchIQ — Start API server
# Run from the deployment root directory.
# Requires: Node.js 18+, .env.local configured (copy from .env.example)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local not found. Copy .env.example and fill in your values."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  npm install --omit=dev
fi

echo "==> Starting WrenchIQ API server..."
# Load .env.local manually (--env-file requires Node 20.6+)
set -o allexport
# shellcheck disable=SC1091
source .env.local
set +o allexport
node server/index.js
