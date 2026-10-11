#!/bin/zsh
# Start lunch@home after a reboot: production server on :3000, served over
# Tailscale at https://<this-mac>.<tailnet>.ts.net.
#
#   ./start.sh          start (builds first if there's no build yet)
#   ./start.sh build    rebuild, then (re)start — use after code changes
#   ./start.sh stop     stop the server
#   ./start.sh status   is it up?
#
# Logs: web/server.log
set -euo pipefail

WEB="${0:A:h}/web"
LOG="$WEB/server.log"
PORT=3000
TS=/Applications/Tailscale.app/Contents/MacOS/Tailscale

# nvm isn't loaded in non-interactive shells
[[ -s "$HOME/.nvm/nvm.sh" ]] && source "$HOME/.nvm/nvm.sh" >/dev/null

pid() { lsof -t -nP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null || true; }

stop() {
  local p=$(pid)
  [[ -z $p ]] && { echo "not running"; return; }
  kill $=p && echo "stopped (pid $p)"
  sleep 1
}

up() {
  [[ -f "$WEB/.env" ]] || { echo "missing web/.env — copy web/.env.example and fill it in"; exit 1; }
  [[ -n $(pid) ]] && { echo "already running on :$PORT (pid $(pid))"; return; }
  [[ -d "$WEB/node_modules" ]] || (cd "$WEB" && npm install)
  [[ -f "$WEB/.next/BUILD_ID" ]] || (cd "$WEB" && npm run build)

  cd "$WEB"
  nohup npm start >>"$LOG" 2>&1 &
  disown

  for _ in {1..20}; do
    [[ $(curl -s -o /dev/null -w '%{http_code}' localhost:$PORT/) == 200 ]] && break
    sleep 1
  done
  [[ -n $(pid) ]] || { echo "failed to start — see $LOG"; tail -20 "$LOG"; exit 1; }
  echo "running on http://localhost:$PORT (pid $(pid)), log: $LOG"

  if [[ -x $TS ]]; then
    "$TS" serve --bg $PORT >/dev/null 2>&1 || echo "tailscale serve failed — is Tailscale running?"
    "$TS" serve status 2>/dev/null | head -1
  fi
}

case "${1:-start}" in
  start)  up ;;
  stop)   stop ;;
  build)  stop; (cd "$WEB" && npm run build); up ;;
  status) [[ -n $(pid) ]] && echo "running (pid $(pid))" || echo "not running"
          [[ -x $TS ]] && "$TS" serve status 2>/dev/null | head -1 ;;
  *)      echo "usage: $0 [start|stop|build|status]"; exit 1 ;;
esac
