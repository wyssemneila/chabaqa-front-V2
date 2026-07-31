#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
DOMAIN="${DOMAIN:-https://chabaqa.io}"
NGINX_SOURCE="${PROJECT_DIR}/nginx/chabaqa-cloudflare.conf"
NGINX_TARGET="${NGINX_TARGET:-/etc/nginx/sites-available/chabaqa}"

fail() {
  echo "[verify-production] $*" >&2
  exit 1
}

assert_no_pm2_chabaqa_apps() {
  if systemctl is-active --quiet pm2-ubuntu.service 2>/dev/null; then
    fail "pm2-ubuntu.service is still active"
  fi

  if systemctl is-enabled --quiet pm2-ubuntu.service 2>/dev/null; then
    fail "pm2-ubuntu.service is still enabled"
  fi

  if systemctl is-active --quiet chabaqa-monitor.timer 2>/dev/null; then
    fail "legacy chabaqa-monitor.timer is still active"
  fi

  if systemctl is-enabled --quiet chabaqa-monitor.timer 2>/dev/null; then
    fail "legacy chabaqa-monitor.timer is still enabled"
  fi

  if ss -ltnp "( sport = :8081 )" | awk 'NR>1 {found=1} END {exit found ? 0 : 1}'; then
    fail "legacy PM2 frontend port 8081 is still listening"
  fi

  if ps -eo args | awk '/\/home\/ubuntu\/chabaqa\/(backend|frontend)/ && !/awk/ {found=1} END {exit found ? 0 : 1}'; then
    fail "legacy Chabaqa PM2 node processes are still running"
  fi
}

assert_container_running() {
  local container="$1"
  local status
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container}" 2>/dev/null || true)"
  case "${status}" in
    healthy|running) ;;
    *) fail "container ${container} is not running/healthy (status=${status:-missing})" ;;
  esac
}

assert_port() {
  local port="$1"
  local line
  line="$(ss -ltnp "( sport = :${port} )" | awk 'NR>1 {print; exit}')"
  [ -n "${line}" ] || fail "port ${port} is not listening"
}

assert_http_ok() {
  local url="$1"
  local label="$2"
  local allowed="${3:-200,204,301,302,307,308}"
  local status
  status="$(curl -k -sS -o /dev/null -w "%{http_code}" "${url}" || true)"
  case ",${allowed}," in
    *",${status},"*) ;;
    *) fail "${label} returned ${status}: ${url}" ;;
  esac
}

cd "${PROJECT_DIR}"

assert_no_pm2_chabaqa_apps

for container in \
  chabaqa-mongo \
  chabaqa-redis \
  chabaqa-backend \
  chabaqa-frontend \
  chabaqa-blackbox-exporter \
  chabaqa-prometheus \
  chabaqa-grafana \
  chabaqa-node-exporter \
  chabaqa-cadvisor
do
  assert_container_running "${container}"
done

assert_port 3000
assert_port 8083
assert_port 9090
assert_port 9115
assert_port 9100
assert_port 8088
assert_port 3001

assert_http_ok "http://127.0.0.1:3000/api/health/ping" "backend local health" "200"
assert_http_ok "http://127.0.0.1:8083/api/health/ping" "frontend local health" "200"
assert_http_ok "http://127.0.0.1:8083/health" "frontend public health" "200"
assert_http_ok "http://127.0.0.1:8083/ping" "frontend public ping" "200"
assert_http_ok "http://127.0.0.1:9090/-/ready" "prometheus readiness" "200"
assert_http_ok "http://127.0.0.1:9115/-/healthy" "blackbox exporter health" "200"
assert_http_ok "http://127.0.0.1:9100/metrics" "node exporter metrics" "200"
assert_http_ok "http://127.0.0.1:8088/healthz" "cadvisor health" "200"
assert_http_ok "http://127.0.0.1:3001/api/health" "grafana health" "200"

assert_http_ok "${DOMAIN}/" "frontend"
assert_http_ok "${DOMAIN}/api" "backend api"
# Nginx must route this exact Next.js BFF path to the frontend rather than the
# general Nest /api proxy. Without a session id, the route intentionally gives
# 400; a backend 404 here means checkout returns cannot be verified.
assert_http_ok "${DOMAIN}/api/payments/verify" "payment verification BFF route" "400"
assert_http_ok "${DOMAIN}/Logos/PNG/frensh1.png" "frontend header logo asset" "200"
assert_http_ok "${DOMAIN}/banners-community/community-3-fitness.png" "frontend community fallback asset" "200"

if [ -f "${NGINX_SOURCE}" ] && [ -f "${NGINX_TARGET}" ]; then
  diff -q "${NGINX_SOURCE}" "${NGINX_TARGET}" >/dev/null || fail "nginx target differs from repo source"
fi

echo "[verify-production] success"
