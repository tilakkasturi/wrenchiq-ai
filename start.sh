#!/bin/bash
# WrenchIQ — Start API server + Tauri desktop app
# Run from the deployment root directory.
# Requires: Node.js 18+, Rust/Tauri prereqs, .env.local configured (copy from .env.example)
#
# Starts the backend and the Vite dev server in the background (PID-tracked
# under .run/), then runs `tauri dev` in the foreground. Stop everything
# with ./stop.sh.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local not found. Copy .env.example and fill in your values."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  npm install
fi

mkdir -p .run
BACKEND_LOG=".run/backend.log"
VITE_LOG=".run/vite.log"

cleanup() {
  echo ""
  echo "==> Shutting down..."
  ./stop.sh
}
trap cleanup EXIT INT TERM

echo "==> Starting WrenchIQ API server..."
(
  set -o allexport
  # shellcheck disable=SC1091
  source .env.local
  set +o allexport
  exec node server/index.js
) >"$BACKEND_LOG" 2>&1 &
echo $! > .run/backend.pid

echo "==> Starting Vite dev server..."
npm run dev >"$VITE_LOG" 2>&1 &
echo $! > .run/vite.pid

echo "==> Starting Tauri app..."
npm run tauri:dev
# tauri:dev runs in the foreground; on exit, `trap cleanup` stops backend + vite.
