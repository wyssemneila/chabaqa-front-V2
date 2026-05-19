#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
ECOSYSTEM_FILE="${PROJECT_DIR}/ecosystem.config.cjs"
NGINX_SOURCE="${PROJECT_DIR}/nginx/chabaqa-cloudflare.conf"
NGINX_TARGET="/etc/nginx/sites-available/chabaqa"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"

echo "[pm2-deploy] project=${PROJECT_DIR}"

if [ "$(id -u)" -eq 0 ] && ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "[pm2-deploy] DEPLOY_USER=${DEPLOY_USER} does not exist; refusing to run privileged app processes"
  exit 1
fi

cleanup_root_pm2_apps() {
  if [ "$(id -u)" -ne 0 ] || ! command -v pm2 >/dev/null 2>&1; then
    return
  fi

  local removed=0
  for app in chabaqa-backend chabaqa-frontend; do
    if pm2 jlist 2>/dev/null | grep -q '"name":"'"${app}"'"'; then
      echo "[pm2-deploy] deleting root-owned PM2 app: ${app}"
      pm2 delete "${app}" || true
      removed=1
    fi
  done

  if [ "${removed}" = "1" ]; then
    pm2 save --force || true
  fi
}

run_pm2() {
  if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    sudo -u "${DEPLOY_USER}" pm2 "$@"
  else
    pm2 "$@"
  fi
}

run_as_deploy_user() {
  if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    sudo -u "${DEPLOY_USER}" "$@"
  else
    "$@"
  fi
}

pm2_jlist() {
  if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    sudo -u "${DEPLOY_USER}" pm2 jlist
  else
    pm2 jlist
  fi
}

pm2_app_exists() {
  local app_name="$1"
  pm2_jlist | grep -q '"name":"'"${app_name}"'"'
}

get_pm2_pid() {
  local app_name="$1"
  if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    sudo -u "${DEPLOY_USER}" pm2 pid "${app_name}" | tail -n 1
  else
    pm2 pid "${app_name}" | tail -n 1
  fi
}

assert_port_owned_by_pm2() {
  local port="$1"
  if ! ss -ltnp "( sport = :${port} )" | awk 'NR>1 {found=1} END {exit found ? 0 : 1}'; then
    echo "[pm2-deploy] nothing is listening on port ${port}"
    exit 1
  fi
}

assert_http_status() {
  local url="$1"
  local expected="$2"
  local label="$3"
  local status
  status="$(curl -sS -o /dev/null -w "%{http_code}" "${url}" || true)"
  if [ "${status}" != "${expected}" ]; then
    echo "[pm2-deploy] ${label} failed: expected ${expected}, got ${status} (${url})"
    exit 1
  fi
}

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[pm2-deploy] pm2 is not installed"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[pm2-deploy] npm is not installed"
  exit 1
fi

cleanup_root_pm2_apps

mkdir -p \
  "${BACKEND_DIR}/uploads/image" \
  "${BACKEND_DIR}/uploads/video" \
  "${BACKEND_DIR}/uploads/document" \
  "${BACKEND_DIR}/uploads/audio" \
  "${BACKEND_DIR}/hls-output" \
  "${FRONTEND_DIR}/.next/standalone/.next/cache"

if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" \
    "${BACKEND_DIR}/src/domains/communication/email-templates/compiled" \
    "${BACKEND_DIR}/dist" \
    "${BACKEND_DIR}/uploads" \
    "${BACKEND_DIR}/hls-output" \
    "${FRONTEND_DIR}/.next"
fi

echo "[pm2-deploy] installing backend dependencies"
run_as_deploy_user npm --prefix "${BACKEND_DIR}" ci

echo "[pm2-deploy] building backend"
run_as_deploy_user npm --prefix "${BACKEND_DIR}" run build

echo "[pm2-deploy] installing frontend dependencies"
run_as_deploy_user npm --prefix "${FRONTEND_DIR}" ci

echo "[pm2-deploy] building frontend"
run_as_deploy_user npm --prefix "${FRONTEND_DIR}" run build

echo "[pm2-deploy] syncing frontend standalone static assets"
rm -rf "${FRONTEND_DIR}/.next/standalone/public"
mkdir -p "${FRONTEND_DIR}/.next/standalone/.next/static"
cp -R "${FRONTEND_DIR}/public" "${FRONTEND_DIR}/.next/standalone/public"
cp -R "${FRONTEND_DIR}/.next/static/." "${FRONTEND_DIR}/.next/standalone/.next/static/"

if [ "$(id -u)" -eq 0 ] && id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${FRONTEND_DIR}/.next"
fi

echo "[pm2-deploy] reloading pm2 apps"
if pm2_app_exists chabaqa-backend || pm2_app_exists chabaqa-frontend; then
  run_pm2 startOrReload "${ECOSYSTEM_FILE}" --update-env
else
  run_pm2 start "${ECOSYSTEM_FILE}" --update-env
fi

if [ -f "${NGINX_SOURCE}" ] && command -v nginx >/dev/null 2>&1; then
  if [ "$(id -u)" -eq 0 ]; then
    cp "${NGINX_SOURCE}" "${NGINX_TARGET}"
    ln -sf "${NGINX_TARGET}" /etc/nginx/sites-enabled/chabaqa
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
  else
    echo "[pm2-deploy] skipping nginx install/reload because script is not running as root"
  fi
fi

echo "[pm2-deploy] waiting for services"
sleep 8

BACKEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api || true)"
FRONTEND_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/ || true)"
UPLOADS_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1/uploads/ || true)"

if [ "${BACKEND_STATUS}" != "200" ]; then
  echo "[pm2-deploy] backend health check failed: ${BACKEND_STATUS}"
  run_pm2 logs chabaqa-backend --lines 80 --nostream || true
  exit 1
fi

if [ "${FRONTEND_STATUS}" != "200" ] && [ "${FRONTEND_STATUS}" != "307" ]; then
  echo "[pm2-deploy] frontend health check failed: ${FRONTEND_STATUS}"
  run_pm2 logs chabaqa-frontend --lines 80 --nostream || true
  exit 1
fi

if [ "${UPLOADS_STATUS}" != "301" ] && [ "${UPLOADS_STATUS}" != "403" ] && [ "${UPLOADS_STATUS}" != "404" ]; then
  echo "[pm2-deploy] uploads route returned unexpected status: ${UPLOADS_STATUS}"
  exit 1
fi

assert_http_status "http://127.0.0.1:8081/logo_chabaqa.png" "200" "frontend logo asset"
assert_http_status "http://127.0.0.1:8081/Logos/PNG/frensh1.png" "200" "frontend header logo asset"
assert_http_status "http://127.0.0.1:8081/banners-community/community-1-email-marketing.png" "200" "frontend image fallback asset"
assert_http_status "http://127.0.0.1:8081/placeholder-user.jpg" "200" "frontend avatar fallback asset"

NEXT_LAYOUT_CHUNK="$(find "${FRONTEND_DIR}/.next/standalone/.next/static/chunks/app" -maxdepth 1 -name 'layout-*.js' -print -quit 2>/dev/null || true)"
if [ -z "${NEXT_LAYOUT_CHUNK}" ]; then
  echo "[pm2-deploy] frontend app layout chunk is missing from standalone static assets"
  exit 1
fi
assert_http_status "http://127.0.0.1:8081/_next/static/chunks/app/$(basename "${NEXT_LAYOUT_CHUNK}")" "200" "frontend app layout chunk"

NEXT_FONT_ASSET="$(find "${FRONTEND_DIR}/.next/standalone/.next/static/media" -maxdepth 1 -name '*.woff2' -print -quit 2>/dev/null || true)"
if [ -n "${NEXT_FONT_ASSET}" ]; then
  assert_http_status "http://127.0.0.1:8081/_next/static/media/$(basename "${NEXT_FONT_ASSET}")" "200" "frontend font asset"
fi

assert_port_owned_by_pm2 3000
assert_port_owned_by_pm2 8081

"${PROJECT_DIR}/scripts/verify-production.sh"
"${PROJECT_DIR}/scripts/smoke-production.sh"

run_pm2 save
run_pm2 status

echo "[pm2-deploy] success"
echo "[pm2-deploy] frontend: https://chabaqa.io"
echo "[pm2-deploy] backend : https://chabaqa.io/api"
