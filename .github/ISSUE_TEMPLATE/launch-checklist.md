---
name: Production launch / deploy checklist
about: Gate checklist before deploying to production or accepting real payments at scale
title: "[Launch] "
labels: launch, production
assignees: ''
---

## Pre-deploy

- [ ] All CI jobs green on the commit being deployed (`CI` workflow on `main`)
- [ ] No open **critical** Dependabot / security alerts on `main`
- [ ] `docker compose config` passes locally or on staging
- [ ] Mongo backup completed (`scripts/backup-mongo.sh` or `deploy.sh` pre-deploy backup)
- [ ] Secrets rotated if any were exposed in logs/PRs
- [ ] Stripe webhook endpoint reachable from Stripe dashboard (test event sent)

## Deploy

- [ ] Deploy via `./deploy.sh` or GitHub Actions **Deploy Production** workflow
- [ ] `scripts/smoke-production.sh` passed post-deploy
- [ ] `GET /api/health/ping` and `GET /api/health` return 200
- [ ] Creator login + checkout smoke test on production URL

## Post-deploy

- [ ] Sentry: no new error spike in the first 15 minutes
- [ ] Grafana dashboards show normal request/error rates
- [ ] Public `/status` page reflects healthy state
- [ ] Rollback commit SHA noted in deploy log (for quick revert)

## Rollback (if needed)

See [`docs/runbooks/rollback.md`](../../docs/runbooks/rollback.md).
