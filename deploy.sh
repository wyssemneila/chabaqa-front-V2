#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
BRANCH="${BRANCH:-main}"

echo "[deploy] project=${PROJECT_DIR} branch=${BRANCH}"
cd "$PROJECT_DIR"

echo "[deploy] syncing git branch"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "[deploy] validating docker compose"
docker compose config >/dev/null

echo "[deploy] building images"
docker compose build --pull

echo "[deploy] recreating services"
docker compose up -d --force-recreate --remove-orphans

echo "[deploy] waiting for services"
sleep 15
docker compose ps

echo "[deploy] health checks"
BACKEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api || true)"
FRONTEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/ || true)"

if [ "$BACKEND_STATUS" != "200" ]; then
  echo "[deploy] backend failed health check: $BACKEND_STATUS"
  docker logs chabaqa-backend --tail 120 || true
  exit 1
fi

if [ "$FRONTEND_STATUS" != "200" ] && [ "$FRONTEND_STATUS" != "307" ]; then
  echo "[deploy] frontend failed health check: $FRONTEND_STATUS"
  docker logs chabaqa-frontend --tail 120 || true
  exit 1
fi

echo "[deploy] success"
echo "[deploy] frontend: https://chabaqa.io"
echo "[deploy] backend : https://chabaqa.io/api"
