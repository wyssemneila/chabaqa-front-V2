#!/usr/bin/env bash
# Export OpenAPI JSON when backend is running with ENABLE_SWAGGER=true
set -euo pipefail

OUT="${1:-openapi.json}"
BASE="${API_URL:-http://127.0.0.1:3000/api}"

curl -fsS "${BASE}/docs-json" -o "$OUT"
echo "Wrote ${OUT} ($(wc -c < "$OUT") bytes)"
