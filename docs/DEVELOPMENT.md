# Local Development Guide

## Prerequisites

- Node.js 22+, npm
- Docker + Docker Compose v2
- (optional) `mongosh` for manual DB inspection

## 1. Environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in secrets you actually need locally (Stripe test keys, Google OAuth, etc.). Every
variable is documented inline in the `.env.example` files. Nothing in `.env.example`
contains real secrets — they are placeholders.

## 2. Start infrastructure

```bash
docker compose up -d mongo mongo-init redis minio minio-init clamav
```

- `mongo` runs as a single-node replica set (`rs0`) so Mongoose transactions work exactly
  like production. `mongo-init` runs `rs.initiate()` once and exits — safe to re-run.
- `redis` requires `REDIS_PASSWORD` from your `.env` (see `backend/.env.example`).
- `minio` is the local S3-compatible object store for uploads; `minio-init` creates the bucket.
- `clamav` is used for malware scanning of uploads (`UPLOAD_MALWARE_SCANNING`).

Check health:

```bash
docker compose ps
```

## 3. Backend

```bash
cd backend
npm install
npm run db:seed             # plans + achievements
npm run db:seed:rich-demo   # optional: full demo dataset (see docs/TEST_ACCOUNTS.md)
npm run start:dev           # http://localhost:3000/api, watches for changes
```

Useful scripts: `npm run lint`, `npm test`, `npm run test:e2e`, `npm run db:inspect`.

## 4. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:8083
```

Useful scripts: `npm run lint`, `npm test`, `npm run test:e2e` (Playwright),
`npm run i18n:check:parity` (keeps `en`/`ar`/`fr` locale files in sync).

## 5. Full Docker stack (production-like)

To test the exact production topology locally:

```bash
docker compose up -d --build
```

This builds and runs the frontend/backend containers plus monitoring
(Prometheus/Grafana/Alertmanager/cAdvisor/node-exporter). Frontend is served at
`http://localhost:8083`, backend at `http://localhost:3000/api`, Grafana at
`http://localhost:3001`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend fails with `MongooseServerSelectionError` | Mongo not up / replica set not initiated | `docker compose logs mongo mongo-init`; re-run `docker compose up -d mongo-init` |
| Redis `NOAUTH`/connection refused | Missing `REDIS_PASSWORD` in `backend/.env` | Match the value used by the `redis` service in `docker-compose.yml`/`.env` |
| Uploads fail with malware scan errors | ClamAV still loading virus DB (can take minutes) | Wait for `docker compose ps` to show `clamav` healthy, or set `UPLOAD_MALWARE_SCANNING=optional` locally |
| 404 on `/api/...` routes | Backend not running or wrong `NEXT_PUBLIC_API_URL`/`API_INTERNAL_URL` | Confirm backend is up on port 3000 and env vars match `frontend/.env.example` |
| `npm run build` type errors on fresh clone | Stale `.next`/type cache | `rm -rf frontend/.next` and rebuild |

See also: `docs/runbooks/` for production incident procedures.
