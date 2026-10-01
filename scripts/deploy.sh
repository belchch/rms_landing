#!/usr/bin/env bash
# Выкладка лендинга на прод-VPS (стек и Caddy — в rms_platform/deploy).
#   scripts/deploy.sh
#   PLANBEE_HOST=root@1.2.3.4 scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

host="${PLANBEE_HOST:-root@31.128.38.138}"
remote=/srv/planbee

npm ci
npm run build

# server/ — сборка воркера под edge-рантайм, наружу не отдаётся.
# Keep the independent /next/ preview alongside the main landing.
rsync -az --delete --exclude 'server/' --exclude 'next/' dist/ "${host}:${remote}/www/landing/"
rsync -az functions/api/lead.js "${host}:${remote}/lead/lead.mjs"
rsync -az deploy/lead-server.mjs "${host}:${remote}/lead/lead-server.mjs"

ssh "${host}" "cd ${remote} && docker compose restart lead"

curl -fsS -o /dev/null -w "planbee.pro %{http_code}\n" https://planbee.pro/
