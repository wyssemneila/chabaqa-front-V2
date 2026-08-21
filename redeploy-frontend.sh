#!/usr/bin/env bash
# Rebuild and deploy only the production frontend after UI/UX changes.
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"
SERVICE="${FRONTEND_SERVICE:-chabaqa-frontend}"
CONTAINER="${FRONTEND_CONTAINER:-chabaqa-frontend}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-120}"

fail() {
  echo "[frontend-redeploy] ERROR: $*" >&2
  echo "[frontend-redeploy] Recent frontend logs:" >&2
  docker compose logs --tail=80 "$SERVICE" >&2 || true
  exit 1
}

trap 'fail "deployment failed at line $LINENO"' ERR

cd "$PROJECT_DIR"
echo "[frontend-redeploy] Validating Compose configuration"
docker compose config --quiet

echo "[frontend-redeploy] Building the frontend image only"
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose build "$SERVICE"

echo "[frontend-redeploy] Recreating only $SERVICE"
docker compose up -d --no-deps --force-recreate "$SERVICE"

echo "[frontend-redeploy] Waiting up to ${HEALTH_TIMEOUT_SECONDS}s for $CONTAINER to become healthy"
deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
while (( SECONDS < deadline )); do
  state="$(docker inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null || true)"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || true)"

  if [[ "$state" == "running" && "$health" == "healthy" ]]; then
    image="$(docker inspect --format '{{.Image}}' "$CONTAINER")"
    echo "[frontend-redeploy] Complete: $CONTAINER is healthy on $image"
    exit 0
  fi
  if [[ "$state" == "exited" || "$health" == "unhealthy" ]]; then
    fail "$CONTAINER is $state ($health)"
  fi
  sleep 3
done

fail "$CONTAINER did not become healthy within ${HEALTH_TIMEOUT_SECONDS}s"
