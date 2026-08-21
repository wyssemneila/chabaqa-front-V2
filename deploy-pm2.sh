#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/chabaqa}"

echo "[deploy-pm2] PM2 deployment is deprecated. Running Docker deployment instead."
exec "${PROJECT_DIR}/deploy.sh"
