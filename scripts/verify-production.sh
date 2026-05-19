#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DOMAIN="${DOMAIN:-https://chabaqa.io}"
NGINX_SOURCE="${PROJECT_DIR}/nginx/chabaqa-cloudflare.conf"
NGINX_TARGET="${NGINX_TARGET:-/etc/nginx/sites-available/chabaqa}"

fail() {
  echo "[verify-production] $*" >&2
  exit 1
}

pm2_user_json() {
  sudo -u "${DEPLOY_USER}" pm2 jlist 2>/dev/null || echo "[]"
}

root_pm2_json() {
  if [ "$(id -u)" -eq 0 ]; then
    pm2 jlist 2>/dev/null || echo "[]"
  else
    echo "[]"
  fi
}

assert_http_ok() {
  local url="$1"
  local label="$2"
  local status
  status="$(curl -k -sS -o /dev/null -w "%{http_code}" "${url}" || true)"
  case "${status}" in
    200|204|301|302|307|308) ;;
    *) fail "${label} returned ${status}: ${url}" ;;
  esac
}

assert_port() {
  local port="$1"
  local app="$2"
  local owner_pid
  owner_pid="$(ss -ltnp "( sport = :${port} )" | awk -F'pid=' 'NR>1 {split($2,a,","); print a[1]; exit}')"
  [ -n "${owner_pid}" ] || fail "port ${port} is not listening"

  if ! sudo -u "${DEPLOY_USER}" pm2 pid "${app}" | grep -q "${owner_pid}"; then
    local owner_user owner_cmd
    owner_user="$(ps -o user= -p "${owner_pid}" | awk '{print $1}')"
    owner_cmd="$(ps -o args= -p "${owner_pid}")"
    if [ "${owner_user}" != "${DEPLOY_USER}" ] || ! printf '%s' "${owner_cmd}" | grep -q 'PM2'; then
      fail "port ${port} pid ${owner_pid} is not owned by ${DEPLOY_USER} PM2 app ${app}"
    fi
  fi
}

if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  fail "deploy user ${DEPLOY_USER} does not exist"
fi

if root_pm2_json | grep -q '"name":"chabaqa-\(backend\|frontend\)"'; then
  fail "root PM2 still has Chabaqa apps; delete them before deploy success"
fi

pm2_user_json | grep -q '"name":"chabaqa-backend"' || fail "${DEPLOY_USER} PM2 missing chabaqa-backend"
pm2_user_json | grep -q '"name":"chabaqa-frontend"' || fail "${DEPLOY_USER} PM2 missing chabaqa-frontend"

assert_port 3000 chabaqa-backend
assert_port 8081 chabaqa-frontend

assert_http_ok "${DOMAIN}/" "frontend"
assert_http_ok "${DOMAIN}/api" "backend api"
assert_http_ok "${DOMAIN}/Logos/PNG/frensh1.png" "frontend header logo asset"
assert_http_ok "${DOMAIN}/banners-community/community-3-fitness.png" "frontend community fallback asset"

if [ -f "${NGINX_SOURCE}" ] && [ -f "${NGINX_TARGET}" ]; then
  diff -q "${NGINX_SOURCE}" "${NGINX_TARGET}" >/dev/null || fail "nginx target differs from repo source"
fi

echo "[verify-production] success"
