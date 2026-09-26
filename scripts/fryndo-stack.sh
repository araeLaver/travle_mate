#!/usr/bin/env bash
set -euo pipefail

ROOT="/Volumes/WorkDrive/Develop/03_travle_mate"
DOCKER_BIN="${DOCKER_BIN:-/opt/homebrew/bin/docker}"
LOCAL_URL="${LOCAL_URL:-http://127.0.0.1:39080}"

cd "$ROOT"

compose() {
  "$DOCKER_BIN" compose "$@"
}

health() {
  curl -fsS -m 15 "$LOCAL_URL/health" >/dev/null
  curl -fsS -m 15 "$LOCAL_URL/api/health/live" >/dev/null
  curl -fsS -m 15 "$LOCAL_URL/api/health" >/dev/null
}

case "${1:-status}" in
  start)
    compose up -d
    health
    ;;
  stop)
    compose down
    ;;
  restart)
    compose up -d
    health
    ;;
  status)
    compose ps
    printf "\nLocal URL: %s\n" "$LOCAL_URL"
    health && printf "Health: OK\n"
    ;;
  health)
    health
    printf "Health: OK\n"
    ;;
  *)
    printf "Usage: %s {start|stop|restart|status|health}\n" "$0" >&2
    exit 2
    ;;
esac
