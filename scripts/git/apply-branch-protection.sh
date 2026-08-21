#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

OWNER_REPO="${1:-Louay0007/chabaqa}"

apply_protection() {
  local branch="$1"
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${OWNER_REPO}/branches/${branch}/protection" \
    -f required_status_checks.strict=true \
    -f required_status_checks.contexts[]="Frontend - Lint, Test, Build" \
    -f required_status_checks.contexts[]="Backend - Lint, Test, Build" \
    -f required_status_checks.contexts[]="Docker Compose Validation" \
    -f enforce_admins=true \
    -F required_pull_request_reviews.dismiss_stale_reviews=true \
    -F required_pull_request_reviews.require_code_owner_reviews=false \
    -f required_pull_request_reviews.required_approving_review_count=1 \
    -F restrictions=
}

apply_protection main

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${OWNER_REPO}/branches/develop/protection" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]="Frontend - Lint, Test, Build" \
  -f required_status_checks.contexts[]="Backend - Lint, Test, Build" \
  -f required_status_checks.contexts[]="Docker Compose Validation" \
  -f enforce_admins=false \
  -F required_pull_request_reviews.dismiss_stale_reviews=true \
  -F required_pull_request_reviews.require_code_owner_reviews=false \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -F restrictions=

echo "Branch protection applied to main and develop"
