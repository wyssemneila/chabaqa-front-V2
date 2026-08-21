# Chabaqa

Chabaqa is a community/creator platform: courses, challenges, events, chapters, DM
broadcasts/automations, payments (Stripe/Flouci/Konnect), and an admin/moderation suite.

Monorepo layout:

```
chabaqa/
├── backend/            NestJS API (MongoDB + Mongoose, Redis, BullMQ, Socket.IO)
├── frontend/            Next.js 15 App Router UI (creator, admin, learner, landing)
├── docker-compose.yml   Full production-like stack (mongo, redis, minio, clamav, monitoring)
├── monitoring/          Prometheus, Grafana, Blackbox, Alertmanager config
├── docs/                Runbooks, architecture notes, production readiness plan
└── scripts/, deploy.sh  Deployment + operational scripts
```

## Architecture (high level)

```
┌────────────┐      HTTPS       ┌───────────────┐
│  Browser   │ ───────────────▶ │  Next.js FE   │  (SSR + API proxy)
└────────────┘                  └───────┬───────┘
                                         │ /api/* (server-side fetch)
                                         ▼
                                 ┌───────────────┐        ┌────────────┐
                                 │  NestJS API   │◀──────▶│   Redis    │ (cache, queues, socket adapter)
                                 └───────┬───────┘        └────────────┘
                        ┌────────────────┼────────────────┐
                        ▼                ▼                ▼
                 ┌────────────┐  ┌──────────────┐  ┌─────────────┐
                 │  MongoDB   │  │ MinIO (S3)   │  │  ClamAV     │
                 │ (replica   │  │ media store  │  │ malware scan│
                 │  set rs0)  │  └──────────────┘  └─────────────┘
                 └────────────┘
```

Observability: Prometheus scrapes `/api/metrics/prometheus` + Blackbox probes; Grafana
dashboards; Alertmanager routes critical alerts; OpenTelemetry traces (optional) and
Sentry error tracking (optional, gated by `SENTRY_DSN`).

## Quick start (local development)

Prerequisites: Node.js 22+, Docker + Docker Compose, npm.

```bash
git clone <repo-url> chabaqa && cd chabaqa

# 1. Infra (Mongo replica set, Redis, MinIO, ClamAV)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d mongo mongo-init redis minio minio-init clamav

# 2. Backend
cd backend && npm install
npm run db:seed          # plans + achievements
npm run start:dev        # http://localhost:3000/api

# 3. Frontend (new terminal)
cd frontend && npm install
npm run dev               # http://localhost:8083
```

New developer target: a runnable stack (frontend + backend + infra) in under 30 minutes.
See `docs/DEVELOPMENT.md` for full local setup, seeding, and troubleshooting, and
`docs/DEPLOYMENT.md` for production deployment via `deploy.sh` and Docker Compose.

## Testing

```bash
cd backend && npm test && npm run test:e2e
cd frontend && npm test && npm run test:e2e   # Playwright
```

CI runs lint, unit tests, backend E2E tests, Playwright E2E, dependency audits, and a
Docker Compose validation job on every push/PR to `main`/`develop` (`.github/workflows/ci.yml`).

## Key docs

- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — local dev setup, seeding, common tasks
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production deployment, rollback, secrets
- [`docs/PRODUCTION_READINESS_PLAN.md`](docs/PRODUCTION_READINESS_PLAN.md) — phased hardening plan
- [`docs/runbooks/`](docs/runbooks) — incident runbooks (backend down, Mongo down, rollback, Stripe, etc.)
- [`/status`](https://chabaqa.io/status) — public health page (also at `frontend/app/status/page.tsx`)
- [`docs/TEST_ACCOUNTS.md`](docs/TEST_ACCOUNTS.md) — seeded demo/test accounts

## License

Proprietary — all rights reserved.
