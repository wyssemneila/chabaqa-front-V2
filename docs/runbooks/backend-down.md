# Runbook: Backend Down / Unhealthy

**Trigger:** `BackendDown` or `HttpProbeFailing` alert, or `GET /api/health/ping` failing.

## 1. Triage

```bash
docker compose ps chabaqa-backend
docker compose logs --tail=200 chabaqa-backend
curl -sf http://127.0.0.1:3000/api/health/ping || echo "DOWN"
```

Common causes, in order of likelihood:

1. **Mongo unreachable** — check `docker compose ps mongo` and
   `docker exec chabaqa-mongo mongosh --eval 'db.adminCommand("ping")'`.
2. **Redis unreachable/auth failure** — check `REDIS_PASSWORD` matches between
   root `.env` and `backend/.env`; `docker compose logs redis`.
3. **Out of memory** — `docker stats chabaqa-backend`; the container limit is 512M
   (see `docker-compose.yml`). Bump `deploy.resources.limits.memory` temporarily if needed.
4. **Bad deploy** (new code crash-looping) — check for a recent deploy in `git log`.

## 2. Mitigate

```bash
# Restart just the backend
docker compose restart chabaqa-backend

# If crash-looping after a deploy, roll back (see docs/runbooks/rollback.md)
BRANCH=<last-good-sha> ./deploy.sh
```

## 3. Verify recovery

```bash
curl -sf http://127.0.0.1:3000/api/health/ping
curl -sf http://127.0.0.1:3000/api/health | jq .
```

Confirm the `BackendDown`/`HttpProbeFailing` alerts clear in Alertmanager
(`http://localhost:9093` or `/monitoring/alertmanager/` in production).

## 4. Follow-up

- If root cause was resource exhaustion, review Grafana dashboards for the trend
  leading up to the incident and consider raising container limits or adding a
  second backend replica behind a load balancer.
- If root cause was a bad deploy, add a regression test before re-deploying.
