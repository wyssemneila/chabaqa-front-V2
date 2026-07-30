#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-Louay0007/chabaqa}"
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-ubuntu}"
VPS_PORT="${VPS_PORT:-22}"
VPS_PROJECT_DIR="${VPS_PROJECT_DIR:-/home/ubuntu/chabaqa}"
VPS_PASSWORD="${VPS_PASSWORD:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install from https://cli.github.com/" >&2
  exit 1
fi

if [ -z "$VPS_HOST" ]; then
  echo "Set VPS_HOST before running. Example: VPS_HOST=76.13.57.215 bash setup-cicd.sh" >&2
  exit 1
fi

if [ -z "$VPS_PASSWORD" ]; then
  echo "Set VPS_PASSWORD before running. Example: VPS_PASSWORD='your-password' bash setup-cicd.sh" >&2
  exit 1
fi

echo "Configuring GitHub Actions secrets for $REPO"

gh secret set VPS_HOST --repo "$REPO" --body "$VPS_HOST"
gh secret set VPS_USER --repo "$REPO" --body "$VPS_USER"
gh secret set VPS_PORT --repo "$REPO" --body "$VPS_PORT"
gh secret set VPS_PROJECT_DIR --repo "$REPO" --body "$VPS_PROJECT_DIR"
gh secret set VPS_PASSWORD --repo "$REPO" --body "$VPS_PASSWORD"

echo "Done. Next step: push to main to trigger deployment."
