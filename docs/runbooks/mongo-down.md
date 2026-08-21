# Runbook: MongoDB Unreachable / Replica Set Issues

**Trigger:** Backend logs show `MongooseServerSelectionError`, or `mongo` container
is unhealthy/restarting.

## 1. Triage

```bash
docker compose ps mongo
docker compose logs --tail=200 mongo
docker exec chabaqa-mongo mongosh --quiet --eval 'rs.status()'
```

## 2. Common issues

- **Replica set not initiated** (fresh volume / first boot): re-run the one-shot
  init job:

  ```bash
  docker compose up -d mongo-init
  docker logs chabaqa-mongo-init
  ```

- **Disk full**: `docker exec chabaqa-mongo df -h /data/db`. Free space or expand
  the volume; Mongo will refuse writes below its configured free-space threshold.
- **Container OOM-killed**: `docker inspect chabaqa-mongo | grep OOMKilled`. Raise
  the `deploy.resources.limits.memory` for `mongo` in `docker-compose.yml`.
- **Corrupted data / won't start**: restore the latest backup (see
  `docs/runbooks/rollback.md` §4) into a fresh volume rather than attempting
  in-place repair on production data.

## 3. Recovery

```bash
docker compose restart mongo
# wait for healthy, then:
docker compose up -d mongo-init
docker compose restart chabaqa-backend
```

## 4. Verify

```bash
docker exec chabaqa-mongo mongosh --quiet --eval 'rs.status().ok'   # expect 1
curl -sf http://127.0.0.1:3000/api/health | jq .
```

## 5. Prevention

- Nightly backups run via `scripts/backup-mongo.sh` (cron) and before every deploy
  (`deploy.sh`). Verify backups exist: `ls -la .deploy-backups`.
- Monitor disk usage via the `HostLowDiskSpace` Prometheus alert.
