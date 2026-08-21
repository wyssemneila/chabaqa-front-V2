# Runbook: Production Rollback

**When to use:** a deploy to `main` broke the site (5xx spike, failed health checks,
broken critical flow) and needs to be reverted quickly.

## 1. Confirm the problem

- Check Grafana (`https://chabaqa.io/monitoring/grafana/`) for error-rate/latency spikes.
- Check `docker compose ps` on the host — are `chabaqa-backend`/`chabaqa-frontend` healthy?
- Check `docker compose logs --tail=200 chabaqa-backend chabaqa-frontend`.

## 2. Fast rollback (containers only, no git changes)

If the previous images are still cached locally and only the running containers need to
revert (e.g. bad env var applied without a code change):

```bash
ssh ubuntu@<host>
cd /home/ubuntu/chabaqa
docker compose up -d --no-deps --build chabaqa-backend chabaqa-frontend
```

## 3. Full rollback (revert to last known-good commit)

```bash
ssh ubuntu@<host>
cd /home/ubuntu/chabaqa
git log --oneline -10                 # identify last good commit/tag
BRANCH=<last-good-sha-or-tag> ./deploy.sh
```

`deploy.sh` will:
1. Take a fresh Mongo backup before touching anything.
2. Checkout the target commit.
3. Rebuild and restart both app containers with health-check gating.
4. Run `scripts/smoke-production.sh`; if it fails, the script itself reports and exits
   non-zero — re-run rollback to an even earlier commit if needed.

## 4. Database rollback (only if a migration/backfill corrupted data)

```bash
# List available backups
ls -la /home/ubuntu/chabaqa/.deploy-backups

# Restore (DESTRUCTIVE — drops and replaces collections)
docker exec -i chabaqa-mongo mongorestore --archive --gzip --drop < /home/ubuntu/chabaqa/.deploy-backups/<file>.archive.gz
```

Only restore the database if you are certain the bad deploy corrupted data — most
incidents are fixed by an app-only rollback (§2/§3).

## 5. Post-incident

- Verify `GET /api/health/ping` and `GET /api/health` return 200.
- Run `scripts/smoke-production.sh` manually if not already run by `deploy.sh`.
- Post a summary in the incident channel: what broke, what was rolled back to, root cause.
- Open a follow-up issue for the actual fix before re-attempting the deploy.
