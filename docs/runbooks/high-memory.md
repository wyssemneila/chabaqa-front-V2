# Runbook: High memory / OOM

**Trigger:** `HostLowMemory` alert, container restart loops, slow responses, or
`docker stats` showing backend/mongo near memory limit.

## 1. Triage

```bash
docker stats --no-stream
docker compose ps
docker compose logs --tail=100 chabaqa-backend chabaqa-mongo chabaqa-frontend
free -h
```

Container memory limits (see `docker-compose.yml`):

| Service | Limit |
|---------|-------|
| chabaqa-backend | 512M |
| chabaqa-mongo | 1G |
| chabaqa-frontend | 512M |
| clamav | 1G |

## 2. Mitigate (immediate)

```bash
# Restart the affected service
docker compose restart chabaqa-backend

# If host is out of memory, stop non-essential services temporarily
docker compose stop cadvisor node-exporter
```

## 3. Diagnose

- **Backend heap growth:** check Grafana application metrics; look for request spikes
  or memory leaks after a deploy.
- **Mongo wiredTiger cache:** large aggregations or missing indexes can spike RAM.
- **ClamAV:** virus DB load uses ~512M–1G; ensure it is not competing with app containers
  on a small VPS.

## 4. Longer-term fixes

- Raise `deploy.resources.limits.memory` for the affected service.
- Add swap only as a temporary measure (not a substitute for RAM).
- Profile backend with `NODE_OPTIONS=--max-old-space-size=768` if legitimate heap need.
- Move Mongo to Atlas to offload DB memory from the app VPS.

## 5. Verify recovery

```bash
curl -sf http://127.0.0.1:3000/api/health
docker stats --no-stream chabaqa-backend
```

Alert should clear within 10 minutes once memory is below threshold.
