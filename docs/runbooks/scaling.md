# Scaling playbook

## When to scale

| Signal | Threshold | Action |
|--------|-----------|--------|
| Backend CPU | >70% sustained 15 min | Add second backend replica + load balancer |
| API p95 latency | >500ms on reads | Enable Redis cache; profile slow queries (`MONGO_SLOW_QUERY_MS`) |
| Memory pressure | `HostLowMemory` alert | See [`high-memory.md`](high-memory.md) |
| WebSocket/DM load | Connection errors at peak | Confirm `SOCKET_IO_REDIS_URL` before adding backend replicas |
| Disk | `HostLowDiskSpace` | Expand volume; prune old backups |

## Horizontal scaling (backend)

1. Ensure **Redis** and **Socket.IO Redis adapter** are healthy (`REDIS_URL`, `SOCKET_IO_REDIS_URL`).
2. Run **multiple `chabaqa-backend` replicas** behind nginx upstream or Cloudflare load balancing.
3. Keep **sessions sticky** optional if all state is in Mongo/Redis (JWT is stateless; Socket.IO needs Redis adapter).
4. Run load baseline before/after: `k6 run scripts/load/k6-baseline.js -e BASE_URL=https://staging.chabaqa.io`.

## MongoDB

- **Short term:** Single-node replica set on VPS (transactions enabled).
- **Growth:** MongoDB Atlas M10+ with read preference for analytics.
- **Read-heavy dashboards:** Consider read replicas or pre-aggregated `analyticsdailies`.

## Meilisearch

- Scale vertically first (more RAM for index).
- Reindex after bulk imports: `node scripts/sync-meilisearch-index.js`.

## Known single points of failure

- Single VPS hosting all services — documented risk; mitigate with off-site backups and restore drills.
- ClamAV — upload queue may slow under load; monitor memory.

## Rollback

If a scale-out deploy fails, see [`rollback.md`](rollback.md).
