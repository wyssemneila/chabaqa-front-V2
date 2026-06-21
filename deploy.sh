#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chabaqa}"
MONGO_DATABASE="${MONGO_DATABASE:-chabaqa_local}"
DEPLOY_BACKUP_DIR="${DEPLOY_BACKUP_DIR:-${PROJECT_DIR}/.deploy-backups}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
export COMPOSE_PROJECT_NAME

echo "[deploy] project=${PROJECT_DIR} branch=${BRANCH} compose_project=${COMPOSE_PROJECT_NAME}"
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

is_container_running() {
  local name="$1"
  [ "$(docker inspect --format '{{.State.Running}}' "${name}" 2>/dev/null || true)" = "true" ]
}

mongo_content_count_from_compose() {
  docker exec chabaqa-mongo mongosh --quiet --eval "
const d = db.getSiblingDB('${MONGO_DATABASE}');
const collections = ['communities', 'cours', 'courses', 'challenges', 'events', 'products', 'sessions', 'orders', 'mediaassets'];
let total = 0;
for (const name of collections) {
  try { total += d.getCollection(name).estimatedDocumentCount(); } catch (error) {}
}
print(total);
" 2>/dev/null | tail -n 1
}

mongo_content_count_from_legacy_host() {
  if ! command -v mongosh >/dev/null 2>&1; then
    echo 0
    return
  fi

  mongosh --quiet --host 127.0.0.1 --port 27017 --eval "
const d = db.getSiblingDB('${MONGO_DATABASE}');
const collections = ['communities', 'cours', 'courses', 'challenges', 'events', 'products', 'sessions', 'orders', 'mediaassets'];
let total = 0;
for (const name of collections) {
  try { total += d.getCollection(name).estimatedDocumentCount(); } catch (error) {}
}
print(total);
" 2>/dev/null | tail -n 1 || echo 0
}

backup_compose_mongo() {
  if ! is_container_running chabaqa-mongo; then
    echo "[deploy] mongo backup skipped; chabaqa-mongo is not running yet"
    return
  fi

  mkdir -p "${DEPLOY_BACKUP_DIR}"

  local archive
  archive="${DEPLOY_BACKUP_DIR}/mongo-${MONGO_DATABASE}-predeploy-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"

  echo "[deploy] backing up compose mongo to ${archive}"
  if docker exec chabaqa-mongo mongodump --quiet --db "${MONGO_DATABASE}" --archive --gzip > "${archive}.tmp"; then
    mv "${archive}.tmp" "${archive}"
  else
    rm -f "${archive}.tmp"
    echo "[deploy] mongo backup failed"
    exit 1
  fi
}

restore_legacy_host_mongo_if_needed() {
  if ! is_container_running chabaqa-mongo; then
    return
  fi

  if ! command -v mongodump >/dev/null 2>&1; then
    echo "[deploy] legacy mongo migration skipped; mongodump is not installed on host"
    return
  fi

  local compose_count
  local legacy_count
  compose_count="$(mongo_content_count_from_compose)"
  legacy_count="$(mongo_content_count_from_legacy_host)"

  if ! [[ "${compose_count}" =~ ^[0-9]+$ ]]; then
    compose_count=0
  fi
  if ! [[ "${legacy_count}" =~ ^[0-9]+$ ]]; then
    legacy_count=0
  fi

  echo "[deploy] mongo content counts: compose=${compose_count} legacy_host=${legacy_count}"

  if [ "${compose_count}" -ne 0 ] || [ "${legacy_count}" -eq 0 ]; then
    return
  fi

  mkdir -p "${DEPLOY_BACKUP_DIR}"

  local archive
  archive="${DEPLOY_BACKUP_DIR}/mongo-${MONGO_DATABASE}-legacy-host-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"

  echo "[deploy] compose mongo is empty; migrating legacy host mongo to ${archive}"
  mongodump --quiet --host 127.0.0.1 --port 27017 --db "${MONGO_DATABASE}" --archive="${archive}.tmp" --gzip
  mv "${archive}.tmp" "${archive}"

  docker exec -i chabaqa-mongo mongorestore --drop --archive --gzip < "${archive}"

  compose_count="$(mongo_content_count_from_compose)"
  if ! [[ "${compose_count}" =~ ^[0-9]+$ ]] || [ "${compose_count}" -eq 0 ]; then
    echo "[deploy] legacy mongo migration did not restore content"
    exit 1
  fi
}

backup_compose_mongo

echo "[deploy] building images"
docker compose build --pull

cleanup_legacy_pm2_apps() {
  local removed=0
  local app

  if command -v pm2 >/dev/null 2>&1; then
    for app in chabaqa-backend chabaqa-frontend; do
      if pm2 jlist 2>/dev/null | grep -q '"name":"'"${app}"'"'; then
        echo "[deploy] deleting root/current-user PM2 app: ${app}"
        pm2 delete "${app}" || true
        removed=1
      fi
    done

    if [ "${removed}" = "1" ]; then
      pm2 save --force || true
      pm2 kill || true
    fi
  fi

  if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    removed=0
    for app in chabaqa-backend chabaqa-frontend; do
      if sudo -u "${DEPLOY_USER}" pm2 jlist 2>/dev/null | grep -q '"name":"'"${app}"'"'; then
        echo "[deploy] deleting ${DEPLOY_USER} PM2 app: ${app}"
        sudo -u "${DEPLOY_USER}" pm2 delete "${app}" || true
        removed=1
      fi
    done

    if [ "${removed}" = "1" ]; then
      sudo -u "${DEPLOY_USER}" pm2 save --force || true
      sudo -u "${DEPLOY_USER}" pm2 kill || true
    fi
  fi
}

free_host_port() {
  local port="$1"
  local containers=""
  local pids=""

  if command -v docker >/dev/null 2>&1; then
    containers="$(
      docker ps --format '{{.ID}} {{.Ports}}' 2>/dev/null \
        | awk -v port="${port}" '$0 ~ ":" port "->" { print $1 }' \
        || true
    )"

    if [ -n "${containers}" ]; then
      echo "[deploy] removing containers publishing host port ${port}: ${containers}"
      docker rm -f ${containers} >/dev/null 2>&1 || true
      sleep 2
    fi
  fi

  if command -v fuser >/dev/null 2>&1; then
    pids="${pids} $(fuser "${port}/tcp" 2>/dev/null || true)"
  fi

  if command -v lsof >/dev/null 2>&1; then
    pids="${pids} $(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  fi

  if command -v ss >/dev/null 2>&1; then
    pids="${pids} $(ss -ltnp "sport = :${port}" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)"
  fi

  pids="$(printf '%s\n' ${pids} 2>/dev/null | sort -u | xargs 2>/dev/null || true)"

  if [ -n "${pids}" ]; then
    echo "[deploy] killing processes listening on host port ${port}: ${pids}"
    kill ${pids} >/dev/null 2>&1 || true
    sleep 2
    kill -9 ${pids} >/dev/null 2>&1 || true
    sleep 1
  fi

  if command -v ss >/dev/null 2>&1 && ss -ltn "sport = :${port}" | grep -q ":${port}"; then
    echo "[deploy] port ${port} is still busy after cleanup"
    ss -ltnp "sport = :${port}" || true
    exit 1
  fi
}

cleanup_legacy_pm2_apps
free_host_port 3000
free_host_port 8083

dump_container_diagnostics() {
  local name="$1"
  echo "[deploy] diagnostics for ${name}"
  docker compose ps "${name}" || true
  docker logs "${name}" --tail 200 || true
  docker inspect --format '{{json .State.Health}}' "${name}" || true
}

container_status() {
  local name="$1"
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${name}" 2>/dev/null || true
}

wait_for_container() {
  local name="$1"
  local timeout="$2"
  local started_at
  local status
  started_at="$(date +%s)"

  echo "[deploy] waiting for ${name}"
  while true; do
    status="$(container_status "${name}")"

    if [ "${status}" = "healthy" ] || [ "${status}" = "running" ]; then
      echo "[deploy] ${name} is ${status}"
      return 0
    fi

    if [ "${status}" = "unhealthy" ] || [ "${status}" = "exited" ] || [ "${status}" = "dead" ]; then
      echo "[deploy] ${name} failed with status=${status}"
      dump_container_diagnostics "${name}"
      return 1
    fi

    if [ $(( $(date +%s) - started_at )) -ge "${timeout}" ]; then
      echo "[deploy] ${name} did not become healthy within ${timeout}s (last status=${status:-missing})"
      dump_container_diagnostics "${name}"
      return 1
    fi

    sleep 5
  done
}

echo "[deploy] ensuring infrastructure services"
docker compose up -d --no-recreate mongo redis clamav
wait_for_container chabaqa-mongo 120
wait_for_container chabaqa-redis 120
if ! wait_for_container chabaqa-clamav 60; then
  echo "[deploy] clamav is not healthy yet; continuing because uploads remain fail-closed while malware scanning is required"
fi
restore_legacy_host_mongo_if_needed

echo "[deploy] recreating backend"
docker compose up -d --force-recreate --remove-orphans chabaqa-backend
wait_for_container chabaqa-backend 180

echo "[deploy] recreating frontend"
docker compose up -d --force-recreate --remove-orphans chabaqa-frontend
wait_for_container chabaqa-frontend 120

echo "[deploy] waiting for services"
sleep 15
docker compose ps

echo "[deploy] health checks"
BACKEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health/ping || true)"
FRONTEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:8083/ || true)"

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

assert_http_status "http://127.0.0.1:8083/logo_chabaqa.png" "200" "frontend logo asset"
assert_http_status "http://127.0.0.1:8083/Logos/PNG/frensh1.png" "200" "frontend header logo asset"
assert_http_status "http://127.0.0.1:8083/banners-community/community-1-email-marketing.png" "200" "frontend image fallback asset"
assert_http_status "http://127.0.0.1:8083/placeholder-user.jpg" "200" "frontend avatar fallback asset"

echo "[deploy] success"
echo "[deploy] frontend: https://chabaqa.io"
echo "[deploy] backend : https://chabaqa.io/api"
