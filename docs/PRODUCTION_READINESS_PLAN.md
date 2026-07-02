# Chabaqa Production Readiness Plan

**Document version:** 1.0  
**Last updated:** 2026-07-02  
**Audience:** Engineering, product, and operations  
**Goal:** Reach **100% production-ready** state for real paying users on `chabaqa.io`

---

## How to read this document

This is the **directional implementation plan** for taking Chabaqa from “feature-rich staging” to **production-grade** operation. Work is ordered in **phases**. Do not skip Phase 1 before accepting money at scale.

### Definition of “100% production-ready”

We consider the platform production-ready when **all** of the following are true:

| Pillar | Ready when |
|--------|------------|
| **Reliability** | Mongo replica set or Atlas; automated off-site backups; tested restore; health checks green |
| **Security** | No secrets in git/compose; user 2FA for creators; CSRF/JWT/rate limits verified; dependency audit clean |
| **Observability** | Sentry (or equivalent) + Prometheus alerts → Slack/PagerDuty; public status page |
| **Quality** | CI runs backend + frontend E2E; i18n parity gate; smoke tests pass on every deploy |
| **Compliance** | Privacy policy, cookie consent, export/delete flows documented and tested |
| **Payments** | Stripe webhooks, refunds, audit logs, payout workflow documented for support |
| **UX honesty** | No mock/deceptive UI; empty states and API gaps clearly communicated |
| **Operations** | Runbooks, `.env.example`, onboarding for new engineers, deploy checklist |

---

## Current state snapshot (baseline)

### What is already strong

- **Product surface:** Creator dashboard, community member experience, admin panel (users, finance, moderation, security, analytics).
- **Payments:** Stripe across courses, events, products, sessions, challenges, communities; webhook handling; payment audit logs.
- **Security middleware:** Throttling, CSRF, HTML sanitization, ClamAV upload scanning, JWT + refresh + token blacklist.
- **Deploy discipline:** `deploy.sh` pre-deploy Mongo backup, `verify-production.sh`, `smoke-production.sh`, GitHub Actions deploy workflow.
- **Monitoring foundation:** Prometheus, Grafana, blackbox exporter, node-exporter, cAdvisor.
- **Privacy basics:** Cookie consent, GA4 consent gate, account export (`GET /users/export-data`), account deletion cascade.
- **Tests:** ~589 spec/test files; backend unit + e2e in CI; 11 Playwright specs (not yet in CI).
- **Demo data:** `backend/scripts/seed-rich-demo.js` for full staging scenarios.

### Known gaps (summary)

| Area | Status | Risk |
|------|--------|------|
| MongoDB | Standalone single node | No HA, no multi-document transactions |
| Backups | Pre-deploy local only | Data loss if VPS fails |
| Redis | Container runs; **not enabled in compose env** | Queues/cache/Socket.IO scaling degraded |
| Secrets | Defaults in `docker-compose.yml` | Credential leakage |
| Error tracking | None (no Sentry) | Blind to production failures |
| Frontend E2E | 11 specs, **not in CI** | UI regressions ship silently |
| Search | Mongo regex fallback | Poor search UX at scale |
| User 2FA | Admin only | Creator account takeover risk |
| Video HLS | Offline `convert-to-hls.js` | No automated transcoding in prod image |
| Documentation | No root README / `.env.example` | Onboarding and deploy friction |

---

## Phase overview (implementation order)

```text
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6 ──► Launch
Foundation   Infra        CI/CD        Ops          Security     Features     Scale        Go-live
(1 week)     (2–3 wks)    (1–2 wks)    (1–2 wks)    (2 wks)      (3–4 wks)    (ongoing)    (gate)
```

| Phase | Name | Duration (est.) | Blocks launch? |
|-------|------|-----------------|----------------|
| **0** | Foundation & documentation | 1 week | No |
| **1** | Critical infrastructure | 2–3 weeks | **Yes** |
| **2** | CI/CD & quality gates | 1–2 weeks | **Yes** |
| **3** | Observability & incident response | 1–2 weeks | **Yes** |
| **4** | Security & compliance hardening | 2 weeks | **Yes** |
| **5** | Production feature completion | 3–4 weeks | Partial |
| **6** | Scale, performance & resilience | Ongoing | No (post-launch) |
| **Launch** | Production gate & soft launch | 1 week | — |

---

## Phase 0 — Foundation & documentation

**Goal:** Make the repo operable by any engineer and eliminate “tribal knowledge.”

### 0.1 Repository documentation

| Task | Status | Deliverable | Acceptance criteria |
|------|--------|-------------|---------------------|
| Root `README.md` | Not started | Setup, architecture diagram, links | New dev can run stack in &lt; 30 min |
| `docs/DEVELOPMENT.md` | Not started | Local dev: Docker backend + `npm run dev` frontend | Matches current workflow (port 3000/8083) |
| `docs/DEPLOYMENT.md` | Not started | VPS deploy, secrets, rollback | Documents `deploy.sh`, GitHub Actions |
| `docs/TEST_ACCOUNTS.md` | Not started | Rich demo credentials | Password `Demo123456!`, creator slugs listed |

### 0.2 Environment templates

| Task | Status | Deliverable | Acceptance criteria |
|------|--------|-------------|---------------------|
| `backend/.env.example` | Not started | All required keys, no secrets | `validateStartupEnv()` passes when filled |
| `frontend/.env.example` | Not started | `NEXT_PUBLIC_*`, `API_INTERNAL_URL` | Document dev vs Docker vs prod |
| `docker-compose.override.example.yml` | Not started | Local overrides without secrets | Optional Redis/MinIO for dev |

**Key env vars to document:**

```bash
# Backend (required in production)
MONGO_URI / MONGODB_URI
JWT_SECRET / JWT_REFRESH_SECRET
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
FRONTEND_URL / SERVER_URL
REDIS_ENABLED=true
REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
SOCKET_IO_REDIS_URL or REDIS_URL
```

### 0.3 Production readiness tracking

| Task | Status | Deliverable | Acceptance criteria |
|------|--------|-------------|---------------------|
| GitHub Project / milestones | Not started | Issues per phase in this doc | Each task has owner + due date |
| Launch checklist issue template | Not started | `.github/ISSUE_TEMPLATE/launch-checklist.md` | Used before every prod deploy |

### Phase 0 exit criteria

- [ ] README + DEVELOPMENT + DEPLOYMENT docs merged
- [ ] `.env.example` files committed (no real secrets)
- [ ] All phase tasks tracked as GitHub issues

---

## Phase 1 — Critical infrastructure

**Goal:** Data durability, correct runtime wiring, and secret hygiene. **Must complete before real payments at scale.**

### 1.1 MongoDB — replica set or Atlas

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Choose strategy | Not started | **Option A:** MongoDB Atlas M10+ **Option B:** 3-node replica set on VPS | Decision recorded in `docs/DEPLOYMENT.md` |
| Enable transactions | Partial | Code already handles replica-set errors in `cours.service.ts`, wallet flows | Payment + account deletion use transactions without fallback warnings |
| Connection string update | Not started | `MONGO_URI` in prod `.env` | `mongosh` ping from backend container |
| Migration runbook | Not started | `docs/runbooks/mongo-migration.md` | Dry-run on staging completed |

**Recommendation:** MongoDB Atlas for first production launch (managed backups, replica set, monitoring).

### 1.2 Automated backups & disaster recovery

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Scheduled `mongodump` | Partial | Extend `deploy.sh` backup logic | Daily cron on VPS **or** Atlas continuous backup |
| Off-site storage | Not started | S3/MinIO bucket `chabaqa-backups` | Backups not only on same disk as DB |
| Retention policy | Not started | 7 daily, 4 weekly, 3 monthly | Documented in runbook |
| Restore drill | Not started | `scripts/restore-mongo-backup.sh` | Quarterly test: restore to staging, smoke test |
| Uploads backup | Not started | `backend/uploads` + MinIO sync | Media recoverable after VPS loss |

**Existing asset:** `deploy.sh` → `backup_compose_mongo()` writes to `.deploy-backups/`.

### 1.3 Redis — enable in production

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Wire compose env | Not started | Add to `chabaqa-backend` in `docker-compose.yml`: `REDIS_ENABLED=true`, `REDIS_HOST=redis`, `REDIS_PASSWORD`, `REDIS_URL` | `CacheService` connects (see `cache.service.ts`) |
| Socket.IO cluster URL | Not started | `SOCKET_IO_REDIS_URL=redis://:password@redis:6379` | `redis-io.adapter.ts` logs connected |
| Email campaign queue | Partial | `email-campaign.queue.ts` uses Redis when enabled | Campaign send works under load |
| WhatsApp queue | Partial | `whatsapp.queue.ts` same pattern | Queue processes when `WHATSAPP_ENABLED=true` |
| Health check | Not started | `/api/health` includes Redis status | Fails loudly if Redis required but down |

### 1.4 Secrets management

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Remove hardcoded secrets from compose | Not started | Move Redis password, MinIO keys to `.env` only | `docker compose config` references `${VAR}` |
| Rotate compromised defaults | Not started | New Redis password, MinIO keys on VPS | Old defaults invalidated |
| GitHub Actions secrets audit | Not started | `VPS_*`, Stripe, JWT documented | No secrets in workflow YAML |
| SSH deploy hardening | Partial | Replace password SSH with key-based auth (optional Phase 2) | Document in DEPLOYMENT.md |

### 1.5 Docker production image freshness

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Rebuild on every deploy | Partial | `deploy.sh` should `docker compose build` | Latest API routes (e.g. DM broadcasts) live |
| Image tagging | Not started | Tag with git SHA | Rollback to previous image possible |
| Staging environment | Not started | Second VPS or compose profile `staging` | Test deploy before prod |

### Phase 1 exit criteria

- [ ] Mongo on replica set or Atlas; transactions verified
- [ ] Daily off-site backups + successful restore test documented
- [ ] `REDIS_ENABLED=true` in production; queues and Socket.IO adapter healthy
- [ ] No plaintext secrets in `docker-compose.yml`
- [ ] Deploy rebuilds backend image automatically

---

## Phase 2 — CI/CD & quality gates

**Goal:** Nothing merges to `main` without automated proof it works.

### 2.1 CI pipeline expansion

| Task | Status | File | Acceptance criteria |
|------|--------|------|---------------------|
| Playwright in CI | Not started | `.github/workflows/ci.yml` | Job runs `frontend/e2e` against staging URL or docker stack |
| i18n parity in CI | Partial | `npm run i18n:ci` exists | Extended to creator + community routes |
| Coverage thresholds | Partial | Backend jest `coverageThreshold` 40% | Raise to 60% for critical domains |
| Dependency audit gate | Complete | `security.yml` + CI audit | High/critical blocks merge |
| Docker validate job | Complete | `ci.yml` → `docker-validate` | Keeps passing |

**Existing Playwright specs (wire into CI):**

- `admin-login.spec.ts`
- `ar-localization-smoke.spec.ts`
- `community-approval.spec.ts`
- `content-moderation.spec.ts`
- `creator-email-campaigns.spec.ts`
- `creator-visual-smoke.spec.ts`
- `mobile-responsive.spec.ts`
- `payout-processing.spec.ts`
- `performance.spec.ts`
- `reliability-smoke.spec.ts`
- `user-management.spec.ts`

### 2.2 Deploy pipeline hardening

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Deploy only after CI green | Not started | GitHub environment protection rules | Manual deploy blocked on failed CI |
| Post-deploy smoke | Partial | `scripts/smoke-production.sh` in deploy workflow | Runs automatically after SSH deploy |
| Rollback procedure | Not started | `docs/runbooks/rollback.md` | Previous image + DB restore steps |
| Staging deploy workflow | Not started | `.github/workflows/deploy-staging.yml` | Push to `staging` branch deploys staging |

### 2.3 Database migration discipline

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Migration log table | Not started | `schema_migrations` collection | Each script records version + timestamp |
| Naming convention | Partial | `backend/scripts/migrate-*.js` | Document order in DEPLOYMENT.md |
| Pre-migration backup hook | Partial | `deploy.sh` already backs up | Migrations run only after backup succeeds |

### Phase 2 exit criteria

- [ ] Playwright smoke suite runs on every PR to `main`
- [ ] i18n parity gate covers creator dashboard
- [ ] Deploy workflow runs smoke tests post-deploy
- [ ] Rollback runbook tested once

---

## Phase 3 — Observability & incident response

**Goal:** Know when production is broken before users tell you.

### 3.1 Error tracking

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Sentry backend | Not started | `@sentry/nestjs` in `main.ts` | Unhandled exceptions appear in Sentry |
| Sentry frontend | Not started | `@sentry/nextjs` | Client errors with source maps |
| Error boundaries | Partial | React error states exist | Sentry captures component stack |
| PII scrubbing | Not started | Sentry `beforeSend` filter | No JWT/password in events |

### 3.2 Alerting pipeline

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Alertmanager | Not started | Add to `docker-compose.yml` | Routes to Slack webhook |
| Wire `monitoring-alerts.yml` | Partial | Rules exist | CPU, memory, backend down, Mongo down fire alerts |
| On-call rotation doc | Not started | `docs/runbooks/on-call.md` | Primary + secondary contact |
| Log aggregation (optional) | Not started | Loki or CloudWatch | Search logs by `requestId` |

**Existing stack:** Prometheus, Grafana, blackbox-exporter (`monitoring/prometheus/`).

### 3.3 Public status & internal dashboards

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Public status page | Not started | Better Uptime / Instatus / simple `/status` | Shows API + frontend health |
| Grafana dashboards review | Partial | Provisioned dashboards | API latency, error rate, queue depth |
| Business metrics | Partial | Analytics + GA4 | Creator signups, MRR, failed payments visible |

### 3.4 Runbooks

| Task | Status | Deliverable |
|------|--------|-------------|
| Backend won't start | Not started | `docs/runbooks/backend-down.md` |
| Mongo connection failures | Not started | `docs/runbooks/mongo-down.md` |
| Stripe webhook failures | Not started | `docs/runbooks/stripe-webhooks.md` |
| High memory / OOM | Not started | `docs/runbooks/high-memory.md` |
| ClamAV blocking uploads | Not started | `docs/runbooks/clamav-uploads.md` |

### Phase 3 exit criteria

- [ ] Sentry receiving errors from staging + production
- [ ] Alert fires on backend health check failure → Slack within 5 min
- [ ] Public status page live
- [ ] Minimum 5 runbooks written and linked from README

---

## Phase 4 — Security & compliance hardening

**Goal:** Protect creator accounts, member data, and payment integrity.

### 4.1 Authentication hardening

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| User/creator 2FA | Not started | TOTP or email OTP (admin pattern exists) | Optional for members, **required for creators with payouts** |
| Session/device management UI | Not started | List active sessions, revoke | Profile → Security |
| Password policy | Partial | bcrypt + lockout | Document min length, breach check (optional) |
| OAuth hardening | Complete | Google OAuth | Callback URLs locked to prod domain |

### 4.2 Application security

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| CSP tightening | Partial | Reduce `unsafe-inline` where possible | No regression in Next.js |
| Security regression CI | Complete | `security.yml` | Keeps passing on `main` |
| Penetration test | Not started | External or OWASP ZAP scheduled | Critical findings fixed |
| Dependency updates | Partial | Dependabot | Monthly review process |

### 4.3 GDPR & privacy

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Account deletion transactional | Partial | Requires Mongo replica set (Phase 1) | Deletion atomic or compensating audit log |
| Data export completeness | Partial | `GET /users/export-data` | Includes orders, messages, enrollments |
| Cookie policy accuracy | Partial | `cookie-consent-provider` | Matches actual cookies set |
| DPA / privacy contact | Not started | Legal review of `/privacy-policy` | Data controller identified |
| Retention policy | Not started | Document log + backup retention | Automated purge of old logs |

### 4.4 Payment compliance

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| PCI scope | Complete | Stripe Checkout only | No PAN storage |
| Webhook signature verification | Complete | `STRIPE_WEBHOOK_SECRET` required in prod | Reject unsigned webhooks |
| Refund audit trail | Partial | `payment-audit-log.schema` | Support can trace refund reason |
| Creator payout KYC | Not started | Document manual RIB verification | Fraud checklist for finance team |

### Phase 4 exit criteria

- [ ] Creator 2FA available and enforced for payout-enabled accounts
- [ ] Account deletion tested end-to-end on replica set
- [ ] Security.yml + manual ZAP scan clean on staging
- [ ] Privacy policy reviewed and published

---

## Phase 5 — Production feature completion

**Goal:** Close gaps that real users will hit in week one.

### 5.1 Search

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Deploy Meilisearch | Not started | Add to compose; `MEILI_HOST`, `MEILI_MASTER_KEY` | `SearchService` uses external engine (`search.service.ts`) |
| Index sync job | Not started | Cron or on-write hooks | New course appears in search &lt; 5 min |
| Frontend search UX | Partial | Search API exists | Global search bar on landing + community |

### 5.2 Media & video

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| HLS pipeline in prod | Not started | Worker container with ffmpeg OR Mux/Cloudflare Stream | Uploaded video playable in course player |
| Image optimization | Not started | sharp on upload or CDN transforms | Thumbnails generated server-side |
| Presigned URLs | Partial | `MEDIA_PRESIGNED_ENABLED` | Enabled for large files in prod |
| Upload limits documented | Partial | `MAX_FILE_SIZE` | Shown in creator UI |

### 5.3 Payments & creator payouts

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Flouci / Konnect (Tunisia) | Partial | Code exists; disabled in compose | Enable when keys available |
| Stripe Connect (optional) | Not started | Automated creator payouts | Or document manual RIB workflow |
| Member refund UX | Partial | Backend `POST order/:orderId/refund` | Creator/admin UI + member request flow |
| Invoice download | Partial | `billing-invoice.schema` | PDF or email invoice to buyer |
| Subscription dunning | Not started | Failed payment emails | Stripe billing portal linked |

### 5.4 Communication

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Transactional email reliability | Partial | SMTP in `.env` | OTP, receipts, tickets deliver &gt; 99% |
| Email deliverability | Not started | SPF/DKIM/DMARC on domain | mail-tester score &gt; 8/10 |
| WhatsApp production decision | Partial | OpenWA in compose | **Decision:** enable with legal review OR disable cleanly |
| Push notifications | Partial | `web-push` keys in `.env` | Creator notifications page works E2E |
| DM broadcasts | Partial | `CommunityDmBroadcastModule` | Creator messages → Broadcasts tab works |

### 5.5 Community & moderation

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Moderation queue | Partial | Admin + community moderator dashboards | Hide/approve/restore tested |
| Support queue | Partial | `community-support` module | Assign + resolve conversation |
| Finance ledger | Partial | `community-finance` module | Transactions tab shows real orders |
| Role permissions audit | Complete | `community-roles.constants.ts` | Document matrix in docs |

### 5.6 UX & i18n

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Creator dashboard i18n | Partial | en/ar for landing; creator may be EN-heavy | `i18n:check:parity` passes for creator |
| Mobile polish | Partial | Playwright mobile project | No horizontal scroll on key flows |
| Accessibility pass | Not started | axe-core in CI | WCAG 2.1 AA on auth, checkout, creator home |
| Onboarding wizard | Partial | Static `/onboarding` | Guided first-community setup |
| Empty states | Partial | P0 honesty work done | No fake metrics anywhere |

### 5.7 API & integrations

| Task | Status | Implementation | Acceptance criteria |
|------|--------|----------------|---------------------|
| Public OpenAPI export | Partial | Swagger when `ENABLE_SWAGGER=true` | Publish redacted spec for partners |
| Google Calendar | Complete | Integration page wired | OAuth flow on staging |
| Webhook documentation | Not started | Stripe + internal webhooks | In DEPLOYMENT.md |

### Phase 5 exit criteria

- [ ] Meilisearch live; search &lt; 200ms p95
- [ ] Video upload → playback works in production
- [ ] Refund flow usable by support without DB access
- [ ] Email OTP reliable; DMARC configured
- [ ] All P0/P1/P2 honest-UI items verified (no mock data in prod code paths)

---

## Phase 6 — Scale, performance & resilience

**Goal:** Handle growth without emergency rewrites. **Start during soft launch; complete over first 3 months.**

### 6.1 Performance

| Task | Status | Target |
|------|--------|--------|
| API p95 latency | Not measured | &lt; 500ms for read endpoints |
| Frontend LCP | Partial (`performance.spec.ts`) | &lt; 2.5s on 4G |
| Mongo slow query log | Not started | Log queries &gt; 100ms |
| Redis cache hit rate | Not started | &gt; 70% for hot endpoints |
| CDN for static assets | Partial (Cloudflare assumed) | Cache hit &gt; 90% for `/uploads` |

### 6.2 Horizontal scaling (when needed)

| Task | Status | Trigger |
|------|--------|---------|
| Second backend instance | Not started | CPU &gt; 70% sustained |
| Sticky sessions / Redis Socket.IO | Partial | Required before 2+ backend replicas |
| Mongo read replicas | Not started | Read-heavy analytics |
| Load balancer | Not started | nginx upstream or Cloudflare load balancing |

### 6.3 Load testing

| Task | Status | Tool | Acceptance |
|------|--------|------|------------|
| API load test | Not started | k6 or Artillery | 500 concurrent users, &lt; 1% error |
| WebSocket load test | Not started | k6 | 1000 concurrent DM connections |
| Upload stress test | Not started | Custom | ClamAV queue doesn't OOM |

### Phase 6 exit criteria

- [ ] Load test baseline documented
- [ ] Scaling playbook written
- [ ] No single point of failure except VPS (documented risk acceptance)

---

## Launch gate — production go/no-go checklist

Complete **all** items before announcing to real paying users.

### Infrastructure (Phase 1)

- [ ] Mongo replica set or Atlas in production
- [ ] Off-site backups running daily; restore tested in last 30 days
- [ ] Redis enabled; email/WhatsApp queues healthy
- [ ] Secrets not in git; production `.env` on VPS only
- [ ] `docker compose build` on deploy; image tagged with SHA

### Quality (Phase 2)

- [ ] CI green on `main` (lint, test, build, security)
- [ ] Playwright smoke passed on staging
- [ ] `verify-production.sh` and `smoke-production.sh` pass on prod

### Observability (Phase 3)

- [ ] Sentry configured for prod
- [ ] Alerts route to Slack
- [ ] Status page public

### Security (Phase 4)

- [ ] Creator 2FA available
- [ ] Account delete/export tested
- [ ] Stripe webhooks verified in Stripe dashboard

### Features (Phase 5)

- [ ] Sign up → verify email → create community → publish course → purchase → access content (E2E)
- [ ] Admin can moderate, view finance, manage users
- [ ] Support can handle refund request
- [ ] No deceptive UI in creator or landing pages

### Legal & business

- [ ] Terms of service, privacy policy, pricing page live
- [ ] Support email monitored
- [ ] Incident response contact defined

---

## Feature completeness matrix

Legend: ✅ Complete · 🟡 Partial · ❌ Not started

| Domain | Feature | Status | Phase |
|--------|---------|--------|-------|
| Auth | Email/password | ✅ | — |
| Auth | Google OAuth | ✅ | — |
| Auth | Email verification OTP | ✅ | — |
| Auth | User 2FA | ❌ | 4 |
| Auth | Admin 2FA | ✅ | — |
| Payments | Stripe checkout (all content types) | ✅ | — |
| Payments | Webhooks | ✅ | — |
| Payments | Refunds API | 🟡 | 5 |
| Payments | Flouci/Konnect | 🟡 | 5 |
| Payments | Stripe Connect payouts | ❌ | 5/6 |
| Community | RBAC roles | ✅ | — |
| Community | Moderation queue | 🟡 | 5 |
| Community | Support queue | 🟡 | 5 |
| Community | Finance ledger | 🟡 | 5 |
| Content | Courses/challenges/events/sessions/products | ✅ | — |
| Content | Video HLS streaming | 🟡 | 5 |
| Content | Resource downloads | ✅ | — |
| Comms | Email campaigns | 🟡 | 1, 5 |
| Comms | DM + broadcasts | 🟡 | 5 |
| Comms | WhatsApp (OpenWA) | 🟡 | 5 |
| Comms | Push notifications | 🟡 | 5 |
| Search | Global search | 🟡 | 5 |
| Admin | Full admin panel | ✅ | — |
| Analytics | Creator + GA4 | 🟡 | 5 |
| i18n | en/ar landing | 🟡 | 2, 5 |
| i18n | Creator dashboard ar | 🟡 | 5 |
| Privacy | Export/delete account | 🟡 | 1, 4 |
| Privacy | Cookie consent | 🟡 | 4 |
| Ops | Prometheus/Grafana | 🟡 | 3 |
| Ops | Sentry | ❌ | 3 |
| Ops | Automated backups | 🟡 | 1 |
| Ops | Status page | ❌ | 3 |
| Docs | README / env examples | ❌ | 0 |
| Testing | Backend CI | ✅ | — |
| Testing | Frontend E2E CI | ❌ | 2 |
| Testing | Load testing | ❌ | 6 |

---

## Suggested timeline (aggressive)

| Week | Focus | Outcome |
|------|-------|---------|
| 1 | Phase 0 + start Phase 1 | Docs, `.env.example`, Atlas/Mongo decision |
| 2–3 | Phase 1 | Backups, Redis, secrets, replica set |
| 4 | Phase 2 | Playwright CI, deploy smoke |
| 5 | Phase 3 | Sentry, alerts, status page |
| 6 | Phase 4 | 2FA, GDPR tests, security scan |
| 7–9 | Phase 5 | Search, video, payouts, email deliverability |
| 10 | Launch gate | Soft launch with limited creators |
| 11+ | Phase 6 | Load test, scale as needed |

---

## Ownership template (fill in)

| Phase | DRI (Directly Responsible Individual) | Reviewer |
|-------|--------------------------------------|----------|
| Phase 0 | _TBD_ | _TBD_ |
| Phase 1 | _TBD_ | _TBD_ |
| Phase 2 | _TBD_ | _TBD_ |
| Phase 3 | _TBD_ | _TBD_ |
| Phase 4 | _TBD_ | _TBD_ |
| Phase 5 | _TBD_ | _TBD_ |
| Phase 6 | _TBD_ | _TBD_ |
| Launch gate | _TBD_ | _TBD_ |

---

## Appendix A — Key file references

| Area | Path |
|------|------|
| Docker compose | `docker-compose.yml` |
| Production Dockerfiles | `backend/Dockerfile.prod`, `frontend/Dockerfile.prod` |
| Deploy script | `deploy.sh` |
| CI | `.github/workflows/ci.yml` |
| Security CI | `.github/workflows/security.yml` |
| Production deploy | `.github/workflows/deploy-production.yml` |
| Nginx | `nginx/chabaqa-cloudflare.conf` |
| Monitoring | `monitoring/prometheus/` |
| Rich demo seed | `backend/scripts/seed-rich-demo.js` |
| Plans seed | `backend/src/shared/scripts/seed-plans.ts` |
| Search service | `backend/src/domains/search/search.service.ts` |
| Redis cache | `backend/src/infrastructure/cache/cache.service.ts` |
| Socket.IO Redis | `backend/src/infrastructure/realtime/redis-io.adapter.ts` |
| Playwright E2E | `frontend/e2e/*.spec.ts` |
| i18n CI script | `frontend/package.json` → `i18n:ci` |

---

## Appendix B — Test accounts (staging)

After `npm run db:seed:rich-demo`:

| Role | Email | Password |
|------|-------|----------|
| Creator (primary) | `amina.creator@chabaqa.demo` | `Demo123456!` |
| Creator | `youssef.creator@chabaqa.demo` | `Demo123456!` |
| Member | `sami.member@chabaqa.demo` | `Demo123456!` |
| Admin | `admin.demo@chabaqa.demo` | `Demo123456!` |

**Primary test community:** Creator Launch Studio (`slug: creator-launch-studio`)

---

## Appendix C — Risk register

| Risk | Likelihood | Impact | Mitigation phase |
|------|------------|--------|------------------|
| VPS disk failure loses Mongo | Medium | Critical | Phase 1 backups |
| Redis disabled → campaign queue loss | High | High | Phase 1 Redis |
| Creator account takeover | Medium | High | Phase 4 2FA |
| UI regression in checkout | Medium | High | Phase 2 Playwright CI |
| OpenWA WhatsApp ban | Medium | Medium | Phase 5 decision |
| Single VPS overload | Medium | High | Phase 6 scaling |
| GDPR deletion incomplete | Low | High | Phase 1 + 4 |

---

*This document should be updated at the end of each phase. Link PRs to phase tasks. When all launch gate items are checked, Chabaqa is ready for production users.*
