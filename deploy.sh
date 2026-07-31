#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chabaqa}"
MONGO_DATABASE="${MONGO_DATABASE:-chabaqa_local}"
DEPLOY_BACKUP_DIR="${DEPLOY_BACKUP_DIR:-${PROJECT_DIR}/.deploy-backups}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
NGINX_SOURCE="${NGINX_SOURCE:-${PROJECT_DIR}/nginx/chabaqa-cloudflare.conf}"
NGINX_TARGET="${NGINX_TARGET:-/etc/nginx/sites-available/chabaqa}"
APP_SERVICES=(chabaqa-backend chabaqa-frontend)
INFRA_SERVICES=(mongo mongo-init redis clamav minio minio-init meilisearch)
MONITORING_SERVICES=(blackbox-exporter alertmanager prometheus grafana node-exporter cadvisor)
export COMPOSE_PROJECT_NAME

echo "[deploy] project=${PROJECT_DIR} branch=${BRANCH} compose_project=${COMPOSE_PROJECT_NAME}"
cd "$PROJECT_DIR"

# When deployment runs as root over SSH on a repo owned by ubuntu,
# Git may block operations with a dubious ownership error.
git config --global --add safe.directory "$PROJECT_DIR" || true

if [ "${SKIP_GIT_SYNC:-false}" = "true" ]; then
  echo "[deploy] SKIP_GIT_SYNC=true; using current working tree"
else
  echo "[deploy] syncing git branch"

  if [ -n "${GIT_AUTH_TOKEN:-}" ] && [ -n "${GIT_REPO:-}" ]; then
    GIT_AUTH_USER="${GIT_AUTH_USER:-x-access-token}"
    git remote set-url origin "https://${GIT_AUTH_USER}:${GIT_AUTH_TOKEN}@github.com/${GIT_REPO}.git"
  fi

  git fetch --all --prune
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

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
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose build

cleanup_legacy_pm2_apps() {
  local removed=0
  local app
  local legacy_pids

  if [ "$(id -u)" -eq 0 ] && command -v systemctl >/dev/null 2>&1; then
    for unit in chabaqa-monitor.timer chabaqa-monitor.service; do
      if systemctl list-unit-files "${unit}" >/dev/null 2>&1 || systemctl list-units --all "${unit}" >/dev/null 2>&1; then
        echo "[deploy] disabling legacy PM2 monitor unit: ${unit}"
        systemctl disable --now "${unit}" >/dev/null 2>&1 || true
      fi
    done

    if systemctl list-unit-files pm2-"${DEPLOY_USER}".service >/dev/null 2>&1; then
      echo "[deploy] disabling legacy PM2 startup service: pm2-${DEPLOY_USER}.service"
      systemctl disable --now pm2-"${DEPLOY_USER}".service >/dev/null 2>&1 || true
    fi
  fi

  if [ -d "/root/.pm2" ]; then
    printf '[]' > "/root/.pm2/dump.pm2" || true
    printf '[]' > "/root/.pm2/dump.pm2.bak" || true
  fi

  if [ "$(id -u)" -eq 0 ] && [ -d "/home/${DEPLOY_USER}/.pm2" ]; then
    printf '[]' > "/home/${DEPLOY_USER}/.pm2/dump.pm2" || true
    printf '[]' > "/home/${DEPLOY_USER}/.pm2/dump.pm2.bak" || true
    chown "${DEPLOY_USER}:${DEPLOY_USER}" \
      "/home/${DEPLOY_USER}/.pm2/dump.pm2" \
      "/home/${DEPLOY_USER}/.pm2/dump.pm2.bak" 2>/dev/null || true
  fi

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
    fi

    if [ "$(id -u)" -eq 0 ]; then
      pm2 delete all >/dev/null 2>&1 || true
      pm2 save --force >/dev/null 2>&1 || true
      pm2 kill >/dev/null 2>&1 || true
      if [ -d "/root/.pm2" ]; then
        printf '[]' > "/root/.pm2/dump.pm2" || true
        printf '[]' > "/root/.pm2/dump.pm2.bak" || true
      fi
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
    fi

    sudo -u "${DEPLOY_USER}" pm2 delete all >/dev/null 2>&1 || true
    sudo -u "${DEPLOY_USER}" pm2 save --force >/dev/null 2>&1 || true
    sudo -u "${DEPLOY_USER}" pm2 kill >/dev/null 2>&1 || true

    if [ -d "/home/${DEPLOY_USER}/.pm2" ]; then
      printf '[]' > "/home/${DEPLOY_USER}/.pm2/dump.pm2" || true
      printf '[]' > "/home/${DEPLOY_USER}/.pm2/dump.pm2.bak" || true
      chown "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.pm2/dump.pm2" || true
      chown "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.pm2/dump.pm2.bak" || true
    fi
  fi

  legacy_pids="$(
    ps -eo pid,args \
      | awk '/PM2 v|\/home\/ubuntu\/chabaqa\/(backend|frontend)/ && !/awk/ {print $1}' \
      | xargs 2>/dev/null || true
  )"

  if [ -n "${legacy_pids}" ]; then
    echo "[deploy] killing remaining legacy PM2/Node processes: ${legacy_pids}"
    kill ${legacy_pids} >/dev/null 2>&1 || true
    sleep 2
    kill -9 ${legacy_pids} >/dev/null 2>&1 || true
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
free_host_port 8081
free_host_port 9090
free_host_port 9115
free_host_port 9100
free_host_port 8088
free_host_port 3001

install_nginx_config() {
  if [ ! -f "${NGINX_SOURCE}" ]; then
    echo "[deploy] nginx source missing: ${NGINX_SOURCE}"
    return
  fi

  if ! command -v nginx >/dev/null 2>&1; then
    echo "[deploy] nginx is not installed on host; skipping host nginx reload"
    return
  fi

  if [ "$(id -u)" -ne 0 ]; then
    echo "[deploy] not running as root; skipping host nginx install/reload"
    return
  fi

  echo "[deploy] installing nginx config ${NGINX_SOURCE} -> ${NGINX_TARGET}"
  cp "${NGINX_SOURCE}" "${NGINX_TARGET}"
  ln -sf "${NGINX_TARGET}" /etc/nginx/sites-enabled/chabaqa
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
}

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
docker compose up -d --no-recreate "${INFRA_SERVICES[@]}"
COMPOSE_WHATSAPP_ENABLED="$(
  docker compose config --environment \
    | awk -F= '$1 == "WHATSAPP_ENABLED" { print tolower($2); exit }'
)"
if [ "${WHATSAPP_ENABLED:-${COMPOSE_WHATSAPP_ENABLED:-false}}" = "true" ]; then
  docker compose --profile whatsapp up -d --no-recreate openwa-api
fi
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

echo "[deploy] ensuring monitoring services"
docker compose up -d --no-recreate "${MONITORING_SERVICES[@]}"
wait_for_container chabaqa-cadvisor 90

install_nginx_config

echo "[deploy] waiting for services"
sleep 15
docker compose ps

echo "[deploy] health checks"
BACKEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health/ping || true)"
FRONTEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:8083/api/health/ping || true)"

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

if [ "$FRONTEND_STATUS" != "200" ]; then
  echo "[deploy] frontend failed health check: $FRONTEND_STATUS"
  docker logs chabaqa-frontend --tail 120 || true
  exit 1
fi

assert_http_status "http://127.0.0.1:8083/health" "200" "frontend public health"
assert_http_status "http://127.0.0.1:8083/ping" "200" "frontend public ping"
assert_http_status "http://127.0.0.1:8083/logo_chabaqa.png" "200" "frontend logo asset"
assert_http_status "http://127.0.0.1:8083/Logos/PNG/frensh1.png" "200" "frontend header logo asset"
assert_http_status "http://127.0.0.1:8083/banners-community/community-1-email-marketing.png" "200" "frontend image fallback asset"
assert_http_status "http://127.0.0.1:8083/placeholder-user.jpg" "200" "frontend avatar fallback asset"
assert_http_status "http://127.0.0.1:9090/-/ready" "200" "prometheus readiness"
assert_http_status "http://127.0.0.1:9115/-/healthy" "200" "blackbox exporter health"
assert_http_status "http://127.0.0.1:9100/metrics" "200" "node exporter metrics"
assert_http_status "http://127.0.0.1:8088/healthz" "200" "cadvisor health"

GRAFANA_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health || true)"
if [ "${GRAFANA_STATUS}" != "200" ]; then
  echo "[deploy] grafana health failed: ${GRAFANA_STATUS}"
  docker logs chabaqa-grafana --tail 120 || true
  exit 1
fi

bash "${PROJECT_DIR}/scripts/verify-production.sh"
bash "${PROJECT_DIR}/scripts/smoke-production.sh"

echo "[deploy] success"
echo "[deploy] frontend: https://chabaqa.io"
echo "[deploy] backend : https://chabaqa.io/api"
echo "[deploy] monitoring: prometheus=http://127.0.0.1:9090 grafana=http://127.0.0.1:3001"
