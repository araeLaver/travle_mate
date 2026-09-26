#!/usr/bin/env bash
set -euo pipefail

ROOT="/Volumes/WorkDrive/Develop/03_travle_mate"
CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-/opt/homebrew/bin/cloudflared}"
LOCAL_URL="${LOCAL_URL:-http://127.0.0.1:39080}"

cd "$ROOT"
mkdir -p logs

exec "$CLOUDFLARED_BIN" tunnel --no-autoupdate --url "$LOCAL_URL"
