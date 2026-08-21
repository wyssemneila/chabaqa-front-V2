#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-/home/ubuntu/chabaqa}"

cd "$REPO_DIR"

git fetch origin
git checkout main
git pull --ff-only origin main

if git show-ref --verify --quiet refs/heads/develop; then
  git checkout develop
  git pull --ff-only origin develop || true
else
  git checkout -b develop
fi

git push -u origin develop
git checkout main

echo "Branches ready: main, develop"
