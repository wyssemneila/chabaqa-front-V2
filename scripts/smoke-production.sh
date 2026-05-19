#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-https://chabaqa.io}"
TEST_COMMUNITY_SLUG="${TEST_COMMUNITY_SLUG:-growth-operators-network}"
TEST_COMMUNITY_CREATOR="${TEST_COMMUNITY_CREATOR:-youssef-bouallegue}"
TEST_STRIPE_SESSION="${TEST_STRIPE_SESSION:-}"

fail() {
  echo "[smoke-production] $*" >&2
  exit 1
}

fetch() {
  curl -k -sS "$1"
}

assert_status() {
  local url="$1"
  local label="$2"
  local expected="${3:-200}"
  local status
  status="$(curl -k -sS -o /dev/null -w "%{http_code}" "${url}" || true)"
  case ",${expected}," in
    *",${status},"*) ;;
    *) fail "${label} expected ${expected}, got ${status}: ${url}" ;;
  esac
}

assert_status "${DOMAIN}/" "frontend" "200,307,308"
assert_status "${DOMAIN}/api" "backend api" "200,301,308"
assert_status "${DOMAIN}/Logos/PNG/frensh1.png" "header logo asset"
assert_status "${DOMAIN}/banners-community/community-3-fitness.png" "community fallback asset"
assert_status "${DOMAIN}/en/${TEST_COMMUNITY_CREATOR}/${TEST_COMMUNITY_SLUG}/home" "community member home" "200,307,308"

community_json="$(fetch "${DOMAIN}/api/communities/${TEST_COMMUNITY_SLUG}")"
echo "${community_json}" | grep -q '"logoUrl"' || fail "community response missing logoUrl"
echo "${community_json}" | grep -q '"coverUrl"' || fail "community response missing coverUrl"
echo "${community_json}" | grep -q '"thumbnailUrl"' || fail "community response missing thumbnailUrl"

if [ -n "${TEST_STRIPE_SESSION}" ]; then
  payment_json="$(fetch "${DOMAIN}/api/payments/verify?sessionId=${TEST_STRIPE_SESSION}")"
  echo "${payment_json}" | grep -q '"success":true' || fail "payment response missing success=true"
  echo "${payment_json}" | grep -q '"status":"paid"' || fail "payment response missing status=paid"
  echo "${payment_json}" | grep -q '"provider":"stripe"' || fail "payment response missing provider=stripe"
else
  echo "[smoke-production] TEST_STRIPE_SESSION not set; skipping live Stripe session verification"
fi

echo "[smoke-production] success"
