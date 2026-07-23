#!/bin/bash
# WrenchIQ — Stop API server + Tauri desktop app
# Kills processes started by ./start.sh, tracked via PID files under .run/.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

stop_pid_file() {
  local label="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    return
  fi

  local pid
  pid=$(cat "$pid_file")

  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "==> Stopping ${label} (pid ${pid})..."
    kill "$pid" 2>/dev/null
    for _ in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null
  fi

  rm -f "$pid_file"
}

stop_pid_file "Tauri app"    ".run/tauri.pid"
stop_pid_file "Vite dev server" ".run/vite.pid"
stop_pid_file "API server"   ".run/backend.pid"

# Fallback: catch any stray `tauri dev` / vite processes left without a PID file.
pkill -f "tauri dev" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "==> Stopped."
