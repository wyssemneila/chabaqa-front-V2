# MongoDB migration runbook

## Strategy decision

| Environment | Recommended setup | Connection string |
|-------------|-------------------|-------------------|
| **Local dev** | Single-node replica set via `docker compose up -d mongo mongo-init` | `mongodb://127.0.0.1:27017/chabaqa_local?replicaSet=rs0` |
| **Production (recommended)** | MongoDB Atlas M10+ | Atlas SRV URI with `retryWrites=true&w=majority` |
| **Self-hosted prod** | 3-node replica set on VPS | `mongodb://host1,host2,host3/chabaqa?replicaSet=rs0` |

Atlas is recommended for the first production launch: managed backups, replica set,
and monitoring without operating Mongo yourself.

## Why replica set matters

Chabaqa uses Mongoose multi-document transactions for payments, wallet flows, and
account deletion. These **require** a replica set (or Atlas). A standalone Mongo node
will log warnings and fall back to non-transactional paths.

## Migrating standalone → replica set (local / staging)

1. Back up first: `./scripts/backup-mongo.sh`
2. Stop backend: `docker compose stop chabaqa-backend`
3. Recreate mongo with replica set (already configured in `docker-compose.yml`):
   ```bash
   docker compose up -d mongo mongo-init
   docker logs chabaqa-mongo-init   # expect "replica set initiated"
   ```
4. Update `MONGO_URI` / `MONGODB_URI` to include `?replicaSet=rs0`
5. Restart backend and verify:
   ```bash
   curl -sf http://127.0.0.1:3000/api/health/database | jq .
   ```

## Migrating to MongoDB Atlas

1. Create Atlas cluster (M10+, same region as VPS).
2. `mongodump` from current host (see `scripts/backup-mongo.sh`).
3. `mongorestore` into Atlas (or use Atlas Live Migration).
4. Update production `MONGO_URI` in `backend/.env` on the VPS — **do not commit**.
5. Deploy; verify transactions with a test checkout on staging first.
6. Keep the old Mongo volume for 7 days before deleting.

## Dry-run checklist (staging)

- [ ] `rs.status().ok === 1` from mongosh
- [ ] `GET /api/health` returns `database: up`
- [ ] Test payment creates order + enrollment atomically (no partial state on forced failure)
- [ ] Account deletion completes without orphaned records
- [ ] Restore drill: `scripts/restore-mongo-backup.sh` on a staging DB + smoke test
