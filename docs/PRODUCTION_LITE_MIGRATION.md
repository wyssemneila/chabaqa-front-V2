# Production-lite migration (zero data-loss runbook)

This runbook introduces a smaller production stack **without deleting the
existing stack or its Docker volumes**. It is designed for Dokploy on an 8 GB,
4 vCPU VPS, MongoDB Atlas (or another managed replica set), and S3-compatible
object storage.

## Safety rules

1. Do not run `docker compose down -v`, `docker volume prune`, or remove the
   old Mongo/MinIO volumes during this migration.
2. Take and verify backups before every cutover. A backup is not valid until a
   restore has completed into a separate database.
3. Keep the old production stack stopped-but-intact for seven days after the
   new stack has served production traffic.
4. Rotate the credentials that were previously written to the private VPS
   runbook. Store replacements only in Dokploy/GitHub/managed-service secrets.

## Capacity and services

Use an 8 GB RAM / 4 vCPU VPS with 80 GB SSD and a 2 GB swap file. The VPS runs
only the frontend, backend, Redis, Dokploy's proxy/control plane, and Uptime
Kuma. MongoDB, object storage, full metrics, ClamAV, and Meilisearch do not
run locally. This preserves 3+ GB for the OS, Docker, cache, and deployment
headroom.

The new compose file is [`deploy/production-lite.compose.yml`](../deploy/production-lite.compose.yml).
It has hard cgroup limits, process limits, read-only application filesystems,
bounded logs, Redis eviction, health checks, and automatic restarts.

## Phase 1 — make recoverable backups

On the old host, create an immutable Mongo dump and record its SHA-256:

```bash
mkdir -p /srv/chabaqa-migration
docker exec chabaqa-mongo mongodump --archive --gzip > /srv/chabaqa-migration/mongo-precutover.archive.gz
sha256sum /srv/chabaqa-migration/mongo-precutover.archive.gz > /srv/chabaqa-migration/mongo-precutover.archive.gz.sha256
```

Copy both files to off-host storage. Restore the archive to a temporary managed
database and compare collection counts plus a sample of users, orders, and
uploads before proceeding. For Atlas, use its IP allow-list only temporarily
for the migration host and create a least-privileged migration user.

Export MinIO data separately (or use `mc mirror` to the final bucket). Do not
point production at the new bucket until object count and byte totals match.

## Phase 2 — provision external services

- Create a managed MongoDB replica set, enable continuous backups, and create
  the production database user.
- Create a versioned S3/R2/B2 bucket. Block public listing; use application
  credentials restricted to this bucket.
- Restore Mongo into the target database with `mongorestore --drop` **only
  before it receives any production writes**. Never use `--drop` on the old
  production database.
- Import objects into the final bucket and validate a signed read/write using
  the backend's final credentials.

## Phase 3 — deploy without traffic

Create a Dokploy Docker Compose project from the production-lite file. Set its
encrypted variables and secret env files from `production-lite.env.example`.
Build images in CI and deploy immutable commit-SHA tags; do not build Node.js
images on the VPS. Configure Dokploy domains only after both health checks are
green.

The repository workflow `publish-production-images.yml` publishes the two
commit-SHA images to GHCR. In Dokploy, grant the server a GitHub package token
with read-only `packages` access, then update `BACKEND_IMAGE` and
`FRONTEND_IMAGE` to the same successful commit SHA. Configure a GitHub webhook
or Dokploy's GitHub integration to trigger that deployment only after the image
workflow succeeds.

In Uptime Kuma, add HTTPS monitors every 60 seconds for `/`, `/api/health/ping`,
and `/api/health`, plus a TCP monitor for the managed Mongo endpoint. Send alerts
to Telegram, email, or Discord. Add an external UptimeRobot/Better Stack monitor
for the public API, so an outage of the VPS also alerts you.

## Phase 4 — controlled cutover

1. Put the old application in maintenance/read-only mode or stop public writes.
2. Make one final Mongo dump and object-storage delta sync.
3. Restore/sync that final delta to the managed services.
4. Update the new backend to the final managed Mongo/S3 secrets.
5. Start the new stack and run authenticated smoke tests: login, payment test
   mode, upload/download, realtime connection, and a representative search.
6. Switch DNS/proxy origin to Dokploy. Keep the old stack stopped and unchanged.
7. Watch Uptime Kuma, Sentry, Docker restart counts, disk, and provider metrics
   for at least 24 hours.

## Rollback

If the new application fails after DNS change, restore the old proxy origin and
restart the old application against its untouched Mongo/MinIO volumes. Do not
write to both old and new databases. If writes occurred on the new stack, treat
it as the source of truth and perform a planned reverse migration instead of a
blind rollback.

## Operations

- Alert at 80% disk, 85% RAM sustained for five minutes, two failed HTTP checks,
  or more than two restarts in ten minutes.
- Review container memory weekly; increase a limit only after identifying the
  workload responsible.
- Test a managed Mongo restore monthly and a full migration rehearsal quarterly.
- Update images on a scheduled maintenance window; use pinned image tags, never
  `latest`, for application deployments.
