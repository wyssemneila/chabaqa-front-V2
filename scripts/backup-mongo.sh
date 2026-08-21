#!/usr/bin/env bash
# Dumps the Chabaqa MongoDB database to a gzip'd mongodump archive and prunes
# archives older than RETENTION_DAYS. Intended to run:
#   - before every production deploy (see deploy.sh)
#   - nightly via cron: 0 3 * * * BACKUP_DIR=/home/ubuntu/chabaqa/.deploy-backups \
#       /home/ubuntu/chabaqa/scripts/backup-mongo.sh >> /var/log/chabaqa-backup.log 2>&1
#
# Restore:
#   mongorestore --archive=<file>.archive.gz --gzip --drop --uri "$MONGO_URI"
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./.deploy-backups}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/chabaqa_local?replicaSet=rs0}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE_NAME="chabaqa-mongo-${TIMESTAMP}.archive.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"

mkdir -p "$BACKUP_DIR"

echo "[backup-mongo] dumping ${MONGO_URI} -> ${ARCHIVE_PATH}"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q '^chabaqa-mongo$'; then
  # Run mongodump inside the mongo container so we don't need the client installed on the host.
  docker exec chabaqa-mongo mongodump --uri "$MONGO_URI" --archive --gzip > "$ARCHIVE_PATH"
else
  mongodump --uri "$MONGO_URI" --archive="$ARCHIVE_PATH" --gzip
fi

SIZE="$(du -h "$ARCHIVE_PATH" | cut -f1)"
echo "[backup-mongo] wrote ${ARCHIVE_PATH} (${SIZE})"

# Optional off-host copy to S3/MinIO if credentials + mc/aws CLI are available.
if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
  echo "[backup-mongo] uploading to s3://${BACKUP_S3_BUCKET}/mongo/${ARCHIVE_NAME}"
  aws --endpoint-url "${S3_ENDPOINT:-}" s3 cp "$ARCHIVE_PATH" "s3://${BACKUP_S3_BUCKET}/mongo/${ARCHIVE_NAME}"
fi

echo "[backup-mongo] pruning archives older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -name 'chabaqa-mongo-*.archive.gz' -mtime "+${RETENTION_DAYS}" -print -delete || true

echo "[backup-mongo] done"
