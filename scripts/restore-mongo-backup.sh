#!/usr/bin/env bash
# Restore a mongodump archive created by scripts/backup-mongo.sh or deploy.sh.
# DESTRUCTIVE: --drop replaces existing collections in the target database.
#
# Usage:
#   ./scripts/restore-mongo-backup.sh /path/to/backup.archive.gz
#   MONGO_URI=mongodb://127.0.0.1:27017/chabaqa_staging?replicaSet=rs0 ./scripts/restore-mongo-backup.sh backup.gz
set -euo pipefail

ARCHIVE="${1:-}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/chabaqa_local?replicaSet=rs0}"

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Usage: $0 <backup.archive.gz>" >&2
  exit 1
fi

echo "[restore-mongo] WARNING: this will DROP and replace data in ${MONGO_URI}"
read -r -p "Type RESTORE to continue: " confirm
if [ "$confirm" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

echo "[restore-mongo] restoring ${ARCHIVE} -> ${MONGO_URI}"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q '^chabaqa-mongo$'; then
  docker exec -i chabaqa-mongo mongorestore --uri "$MONGO_URI" --archive --gzip --drop < "$ARCHIVE"
else
  mongorestore --uri "$MONGO_URI" --archive="$ARCHIVE" --gzip --drop
fi

echo "[restore-mongo] done — run smoke tests against the restored database"
