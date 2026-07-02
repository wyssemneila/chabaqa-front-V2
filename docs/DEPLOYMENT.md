# Production Deployment

Chabaqa deploys via `deploy.sh` over SSH to a single Docker host (see
`.github/workflows/deploy-production.yml`), or manually with Docker Compose.

## Prerequisites on the server

- Docker + Docker Compose v2
- `backend/.env` and `frontend/.env` populated from the `.env.example` templates with
  real production secrets (never committed)
- Nginx (or another reverse proxy) terminating TLS and proxying to
  `chabaqa-backend:3000` / `chabaqa-frontend:8083`
- DNS + Cloudflare (or equivalent) in front of the host

## Automated deploy (CI)

Pushing to `main` triggers `.github/workflows/deploy-production.yml`:

1. **validate** job — `docker compose config` + `bash -n` syntax-checks all deploy scripts.
2. **deploy** job (needs `validate`) — SSHes to the host and runs `deploy.sh`, which:
   - syncs the target git branch,
   - validates `docker compose config`,
   - takes a Mongo backup (see below) before touching containers,
   - rebuilds and restarts `chabaqa-backend` / `chabaqa-frontend` with health-check gating,
   - reloads Nginx,
   - runs `scripts/smoke-production.sh` and rolls back on failure.

## Manual deploy

```bash
ssh ubuntu@<host>
cd /home/ubuntu/chabaqa
BRANCH=main ./deploy.sh
```

## MongoDB

**Production recommendation:** MongoDB Atlas M10+ (managed replica set, continuous backup).
**Local / staging:** single-node replica set via `docker compose up -d mongo mongo-init`.

See [`docs/runbooks/mongo-migration.md`](runbooks/mongo-migration.md) for migration steps.

## Database migrations

Run migration scripts in order after a backup succeeds:

1. `backend/scripts/migrate-*.js` — one-off data migrations (run manually, document in commit)
2. `npm run backfill:*` — targeted backfills listed in `backend/package.json`

There is no automatic migration runner yet — always back up first (`scripts/backup-mongo.sh`).

## Rollback

See [`docs/runbooks/rollback.md`](runbooks/rollback.md). Summary:

```bash
git log --oneline -5                 # find last good commit
BRANCH=<last-good-sha-or-tag> SKIP_GIT_SYNC=false ./deploy.sh
# or, to only roll back containers without touching git:
docker compose up -d --no-deps --build chabaqa-backend chabaqa-frontend
```

## Backups

Mongo is backed up nightly (cron) and before every deploy via `scripts/backup-mongo.sh`,
which writes a compressed `mongodump` archive to `DEPLOY_BACKUP_DIR` and optionally
uploads it to the MinIO/S3 bucket for off-host retention. See the script header for
restore instructions.

```bash
# Restore from a backup archive
mongorestore --archive=/path/to/backup.archive --gzip --drop --uri "$MONGO_URI"
```

## Secrets management

- All secrets live in `backend/.env` / `frontend/.env` on the host, outside git.
- `docker-compose.yml` never hardcodes real secret values — every credential is sourced
  from an environment variable with no insecure default; the stack refuses to start
  cleanly without `.env` populated (see `backend/.env.example` for the full list).
- Rotate `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_PASSWORD`, and provider API keys on a
  schedule (see `docs/PRODUCTION_READINESS_PLAN.md` §Security).

## Observability

- Health: `GET /api/health/ping` (liveness), `GET /api/health` (readiness/deep check)
- Metrics: Prometheus at `:9090`, Grafana at `:3001` (dashboards under `monitoring/grafana`)
- Alerts: Alertmanager at `:9093`, routes configured in `monitoring/alertmanager/config.yml`
- Errors: Sentry (optional) — set `SENTRY_DSN` in `backend/.env` and
  `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN` in `frontend/.env`; also mirror both DSN
  vars in root `.env` for Docker Compose build substitution. Leave empty to disable.
- Alerts: Alertmanager → PagerDuty EU — set `PAGERDUTY_ROUTING_KEY` in root `.env`
- Runbooks: [`docs/runbooks/`](runbooks)

## Webhooks

Configure provider webhooks to point at your public API base (`https://<domain>/api/...`).

| Provider | Endpoint | Secret env var | Notes |
|----------|----------|----------------|-------|
| Stripe | `POST /api/payment/webhook/stripe` | `STRIPE_WEBHOOK_SECRET` | Register in Stripe Dashboard → Developers → Webhooks. Use the signing secret from the endpoint. |
| Flouci | `POST /api/payment/webhook/flouci` | per Flouci dashboard | Tunisia local payments when enabled. |
| OpenWA (WhatsApp) | `POST /api/whatsapp/openwa/webhook` | `OPENWA_WEBHOOK_SECRET` | Start `openwa-api` with `--profile whatsapp` only when `WHATSAPP_ENABLED=true`. |

After changing webhook URLs or secrets, redeploy the backend and send a test event from each provider dashboard. Failed deliveries are retried via the internal webhook retry queue (`shabaka_webhook_retry_queued` Prometheus metric).

Reconcile Stripe events periodically: compare Stripe Dashboard → Events with `GET /api/admin/financial/payment-audit-logs` (admin JWT required).

## Data retention

See [`docs/DATA_RETENTION.md`](DATA_RETENTION.md) for backup, audit log, and GDPR export/delete policies.
