#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
BRANCH="${BRANCH:-main}"

echo "[deploy] project=${PROJECT_DIR} branch=${BRANCH}"
cd "$PROJECT_DIR"

# When deployment runs as root over SSH on a repo owned by ubuntu,
# Git may block operations with a dubious ownership error.
git config --global --add safe.directory "$PROJECT_DIR" || true

echo "[deploy] syncing git branch"

if [ -n "${GIT_AUTH_TOKEN:-}" ] && [ -n "${GIT_REPO:-}" ]; then
  GIT_AUTH_USER="${GIT_AUTH_USER:-x-access-token}"
  git remote set-url origin "https://${GIT_AUTH_USER}:${GIT_AUTH_TOKEN}@github.com/${GIT_REPO}.git"
fi

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

assert_http_status() {
  local url="$1"
  local expected="$2"
  local label="$3"
  local status
  status="$(curl -sS -o /dev/null -w "%{http_code}" "${url}" || true)"
  if [ "${status}" != "${expected}" ]; then
    echo "[deploy] ${label} failed: expected ${expected}, got ${status} (${url})"
    exit 1
  fi
}

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

assert_http_status "http://127.0.0.1:8081/logo_chabaqa.png" "200" "frontend logo asset"
assert_http_status "http://127.0.0.1:8081/Logos/PNG/frensh1.png" "200" "frontend header logo asset"
assert_http_status "http://127.0.0.1:8081/banners-community/community-1-email-marketing.png" "200" "frontend image fallback asset"
assert_http_status "http://127.0.0.1:8081/placeholder-user.jpg" "200" "frontend avatar fallback asset"

echo "[deploy] success"
echo "[deploy] frontend: https://chabaqa.io"
echo "[deploy] backend : https://chabaqa.io/api"
