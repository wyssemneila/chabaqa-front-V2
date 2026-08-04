# VPS production deploy — Chabaqa (PRIVATE — DO NOT COMMIT / DO NOT PUSH)

> **WARNING:** This file contains real secrets (JWT, Stripe, SMTP, API keys, etc.).  
> Keep it **only on your machine** or copy sections into the VPS via SSH.  
> It is **not** tracked for push — add to `.gitignore` if needed: `docs/VPS_PRODUCTION_DEPLOY.md`

**Target:** https://chabaqa.io  
**Repo path on VPS:** `/home/ubuntu/chabaqa`  
**SSH user:** `ubuntu`  
**Latest code:** `main` @ `ba5bd44` or newer  
**Domain:** `chabaqa.io`

---

## Quick start (copy-paste on VPS)

```bash
ssh ubuntu@YOUR_VPS_IP
cd /home/ubuntu/chabaqa

# 1) Safety backup
mkdir -p .deploy-backups
docker exec chabaqa-mongo mongodump --quiet --db chabaqa_local --archive --gzip \
  > ".deploy-backups/manual-$(date -u +%Y%m%dT%H%M%SZ).archive.gz" 2>/dev/null || true

# 2) Pull code
git fetch --all --prune && git checkout main && git pull origin main
git log -1 --oneline

# 3) Write env files — use Section 4 below (three heredocs)

# 4) Validate + deploy
docker compose config >/dev/null && echo "compose OK"
sudo BRANCH=main ./deploy.sh

# 5) Meilisearch index (first deploy with search)
MEILI_HOST=http://127.0.0.1:7700 \
MEILI_API_KEY=96ef479553141e82b864732bad5c22f718854e8f45ec999227147791149cfa4d \
MONGO_URI="mongodb://127.0.0.1:27017/chabaqa_local?replicaSet=rs0" \
node scripts/sync-meilisearch-index.js

# 6) Verify
./scripts/verify-production.sh
DOMAIN=https://chabaqa.io ./scripts/smoke-production.sh
```

---

## 1. SSH

```bash
ssh ubuntu@YOUR_VPS_IP
# GitHub Actions deploy uses secrets: VPS_HOST, VPS_USER, VPS_PASSWORD, VPS_PORT, VPS_PROJECT_DIR
```

```bash
export PROJECT_DIR=/home/ubuntu/chabaqa
cd "$PROJECT_DIR"
```

---

## 2. Pre-flight

```bash
df -h /
docker info
docker compose ps
```

---

## 3. Pull `main`

```bash
cd /home/ubuntu/chabaqa
git fetch --all --prune
git checkout main
git pull origin main
git log -1 --oneline
```

---

## 4. Environment files — FULL COPY-PASTE (production)

Run each block on the VPS from `/home/ubuntu/chabaqa`.

### 4.1 Root `.env` (docker compose)

```bash
cd /home/ubuntu/chabaqa
cat > .env << 'ENVEOF'
REDIS_PASSWORD=c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9

MINIO_ROOT_USER=1bee6848690bbec61d7cac85
MINIO_ROOT_PASSWORD=IbYANXJoExbEiDBXjCzFcT8rQhpdnry1
MINIO_BROWSER_REDIRECT_URL=https://chabaqa.io/monitoring/storage/
S3_BUCKET=chabaqa-media
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=ChabaqaGrafana2026!
GRAFANA_ROOT_URL=https://chabaqa.io/monitoring/grafana/

SENTRY_DSN=https://39af9991bd6b2d836924197558269524@o4511666698190848.ingest.de.sentry.io/4511666700025936
NEXT_PUBLIC_SENTRY_DSN=https://39af9991bd6b2d836924197558269524@o4511666698190848.ingest.de.sentry.io/4511666700025936
SENTRY_ENVIRONMENT=production

PAGERDUTY_ROUTING_KEY=R03EMRXTTSLWMMJ0UHM01HN7AGTKIR5L
PAGERDUTY_EVENTS_URL=https://events.eu.pagerduty.com/v2/enqueue
ALERTMANAGER_EXTERNAL_URL=https://chabaqa.io/monitoring/alertmanager/

MEILI_MASTER_KEY=96ef479553141e82b864732bad5c22f718854e8f45ec999227147791149cfa4d
MEILI_GLOBAL_INDEX=chabaqa_content

WHATSAPP_ENABLED=false
OPENWA_API_KEY=
OPENWA_WEBHOOK_SECRET=
OPENWA_WEBHOOK_URL=http://chabaqa-backend:3000/api/whatsapp/openwa/webhook
WHATSAPP_DAILY_SESSION_SEND_LIMIT=200
WHATSAPP_SEND_INTERVAL_MS=1500
WHATSAPP_APPEND_OPT_OUT_FOOTER=true
ENVEOF
chmod 600 .env
```

### 4.2 `backend/.env` (NestJS — full production file)

```bash
cat > backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SERVER_URL=https://chabaqa.io/api
FRONTEND_URL=https://chabaqa.io
NEXT_PUBLIC_APP_URL=https://chabaqa.io

FREE_MODE=false
PLAN_ENFORCEMENT_MODE=true

MONGO_URI=mongodb://mongo:27017/chabaqa_local?replicaSet=rs0
MONGODB_URI=mongodb://mongo:27017/chabaqa_local?replicaSet=rs0
DB_NAME=chabaqa_local

JWT_SECRET=ce327b40c606de304e298a02ae5107e11537392414f9ed1a0df0dce912141b5d
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=9664ebfacdbb5dd516fb8bb9fd72bc92f6475051d36543d39082b04502d6bce3
JWT_REFRESH_EXPIRES_IN=30d
EVENT_QR_JWT_SECRET=557d0a7787161334a9ee15e92ddacc79d04055aa137ed6f08f9dd8a273ba8ba3
EVENT_QR_JWT_TTL=30d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=louay.rjili@issatm.ucar.tn
EMAIL_PASSWORD=nukeujipgserqjdx
EMAIL_FROM=noreply@chabaqa.io
EMAIL_FROM_NAME=Chabaqa
EMAIL_REPLY_TO=noreply@chabaqa.io
EMAIL_LOGO_URL=https://i.ibb.co/bjbBK9yS/logo-chabaqa.png

GOOGLE_CLIENT_ID=946155038247-a12gnhogliomav60pegffq1qj23nkag6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://chabaqa.io/api/auth/google/callback
GOOGLE_CALENDAR_REDIRECT_URI=https://chabaqa.io/api/google-calendar/callback

STRIPE_SECRET_KEY=sk_test_51SxleUE8mHtUwjlZbo7tL2ItMllT0ilgWpTFMhlabikB6IxxJ9Pp9rxDjVpo7c4I7FgtIpRwAt4VzurTwDqAt0mZ00AtJhtW7U
STRIPE_WEBHOOK_SECRET=whsec_7078f44b2594653b818810ce7315726e516533ecf65e005c17a9b8c1690b652c
FLOUCI_APP_TOKEN=your-flouci-token
FLOUCI_APP_SECRET=your-flouci-secret
FLOUCI_ENABLED=false
KONNECT_ENABLED=false
PAYMENTS_REQUIRE_PAID_ORDER=true
PAYMENTS_STRIPE_DEFAULT=true
PAYMENTS_ENABLE_WALLET_FALLBACK=false
PAYMENTS_ENABLE_MANUAL_FALLBACK=false
PAYMENTS_STRIPE_COMMUNITY_ENABLED=true
PAYMENTS_STRIPE_COURSE_ENABLED=true
PAYMENTS_STRIPE_CHAPTER_ENABLED=true
PAYMENTS_STRIPE_CHALLENGE_ENABLED=true
PAYMENTS_STRIPE_EVENT_ENABLED=true
PAYMENTS_STRIPE_PRODUCT_ENABLED=true
PAYMENTS_STRIPE_SESSION_ENABLED=true
PAYMENTS_REDIRECT_ALLOWLIST=chabaqa://,exp://,https://chabaqa.io,https://www.chabaqa.io

WEB_PUSH_SUBJECT=mailto:notifications@chabaqa.io
WEB_PUSH_PUBLIC_KEY=BI8jtDo3S8UZH87PTB3Mj_aYmprDy-6Wtz5cYmaPMQ5Szp3WiTimHxbCKR2aJSfSiw6dijAq_AlK3iCkKSopb_I
WEB_PUSH_PRIVATE_KEY=hqhuZpbd5E61pt-HB-J55A4QFkSrnIWlG6v5VB0opXA

MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

CORS_ORIGIN=https://chabaqa.io
CORS_ALLOWED_ORIGINS=https://chabaqa.io,https://www.chabaqa.io
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

REDIS_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9
REDIS_DB=0
REDIS_TTL=300
REDIS_URL=redis://:c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9@redis:6379/0
SOCKET_IO_REDIS_URL=redis://:c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9@redis:6379/0

UV_THREADPOOL_SIZE=128

OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_NAME=Chabaqa AI Tutor
OPENROUTER_SITE_URL=https://chabaqa.io
AI_PROVIDER=OLLAMA_CLOUD
OLLAMA_API_KEY=b86c5254aff7440a9ba27238e3e91f55.B3gB1y2R0S-4ldZCiGt-Hdh-
OLLAMA_BASE_URL=https://ollama.com/v1
OLLAMA_APP_NAME=Chabaqa AI Tutor
AI_MODEL=gpt-oss:20b-cloud
AI_FALLBACK_MODELS=minimax-m2.1:cloud,glm-4.7:cloud
AI_REQUEST_TIMEOUT_MS=30000
AI_MAX_OUTPUT_TOKENS=700
AI_TEMPERATURE=0.3
AI_CONTEXT_CHAR_LIMIT=16000

GA4_MEASUREMENT_ID=G-1TNRS938CK
GA4_API_SECRET=qV6Skl4NQqGAJY-RS41Hrg
GA4_PROPERTY_ID=479983313
GA4_SERVICE_ACCOUNT_EMAIL=firebase-adminsdk-fbsvc@event-toolbox.iam.gserviceaccount.com
GA4_SERVICE_ACCOUNT_KEY=415d2cd278ffb50f81ba9726a90d2b8ffb0f4c8e
USE_GA4_COURSE_TREND=true

MEDIA_PUBLIC_BASE_URL=https://chabaqa.io
TRUST_PROXY=1
JSON_BODY_LIMIT=2mb
URLENCODED_BODY_LIMIT=2mb
ENABLE_SWAGGER=false
ADMIN_BOOTSTRAP_KEY=1bdc28efc3a9587818d19584cc1a62a88d972a2515ab55c7a64b5e5b828efebb
ADMIN_ALLOW_PASSWORD_ONLY_LOGIN=false
ALLOW_ADMIN_DB_CLEANUP=false
ALLOW_REMOTE_WIPE=false

AFFILIATE_COOKIE_NAME=chabaqa_aff_click
AFFILIATE_IP_HASH_SALT=9e193d2712ff986ced06b7eec9fbfaef
AFFILIATE_DEFAULT_COOKIE_DAYS=30
AFFILIATE_DEFAULT_HOLD_DAYS=14
AFFILIATE_MIN_PAYOUT_DT=50

MEDIA_STORAGE_DRIVER=s3
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=chabaqa-media
S3_ACCESS_KEY=1bee6848690bbec61d7cac85
S3_SECRET_KEY=IbYANXJoExbEiDBXjCzFcT8rQhpdnry1
S3_FORCE_PATH_STYLE=true

CLAMAV_HOST=clamav
CLAMAV_PORT=3310
UPLOAD_MALWARE_SCANNING=required

SENTRY_DSN=https://39af9991bd6b2d836924197558269524@o4511666698190848.ingest.de.sentry.io/4511666700025936
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

MEILI_HOST=http://meilisearch:7700
MEILI_API_KEY=96ef479553141e82b864732bad5c22f718854e8f45ec999227147791149cfa4d
MEILI_GLOBAL_INDEX=chabaqa_content

MONGO_SLOW_QUERY_MS=100

WHATSAPP_ENABLED=false
ENVEOF
chmod 600 backend/.env
```

### 4.3 `frontend/.env`

```bash
cat > frontend/.env << 'ENVEOF'
NEXT_PUBLIC_API_URL=https://chabaqa.io/api
NEXT_PUBLIC_APP_URL=https://chabaqa.io
API_INTERNAL_URL=http://chabaqa-backend:3000/api
NEXT_TELEMETRY_DISABLED=1

NEXT_PUBLIC_SENTRY_DSN=https://39af9991bd6b2d836924197558269524@o4511666698190848.ingest.de.sentry.io/4511666700025936
SENTRY_DSN=https://39af9991bd6b2d836924197558269524@o4511666698190848.ingest.de.sentry.io/4511666700025936
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
ENVEOF
chmod 600 frontend/.env
```

### 4.4 Validate

```bash
cd /home/ubuntu/chabaqa
docker compose config >/dev/null && echo "✓ compose config OK"
```

---

## 5. Secret reference table (what must match)

| Value | Where it must be identical |
|-------|---------------------------|
| `REDIS_PASSWORD` | root `.env` ↔ `backend/.env` ↔ Redis URLs |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | root `.env` ↔ `backend/.env` `S3_ACCESS_KEY` / `S3_SECRET_KEY` |
| `MEILI_MASTER_KEY` | root `.env` ↔ `backend/.env` `MEILI_API_KEY` |
| `SENTRY_DSN` | root `.env`, `backend/.env`, `frontend/.env` |
| `NEXT_PUBLIC_SENTRY_DSN` | root `.env`, `frontend/.env` (+ Docker build arg) |
| `PAGERDUTY_ROUTING_KEY` | root `.env` only (Alertmanager template) |
| `JWT_*` secrets | `backend/.env` only — **do not change on live DB** |
| `STRIPE_WEBHOOK_SECRET` | `backend/.env` ↔ Stripe Dashboard webhook endpoint |

### Generated for this deploy (new)

| Key | Value |
|-----|-------|
| `MEILI_MASTER_KEY` | `96ef479553141e82b864732bad5c22f718854e8f45ec999227147791149cfa4d` |
| `GRAFANA_ADMIN_PASSWORD` | `ChabaqaGrafana2026!` (set in root `.env` above) |

### Observability

| Service | Value |
|---------|-------|
| **Sentry DSN (EU)** | `https://39af9991bd6b2d836924197558269524@o4511666698190848.ingest.de.sentry.io/4511666700025936` |
| **PagerDuty routing key (EU)** | `R03EMRXTTSLWMMJ0UHM01HN7AGTKIR5L` |
| **PagerDuty events URL** | `https://events.eu.pagerduty.com/v2/enqueue` |

### Stripe (currently TEST mode)

| Key | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | `sk_test_51SxleUE8mHtUwjlZbo7tL2ItMllT0ilgWpTFMhlabikB6IxxJ9Pp9rxDjVpo7c4I7FgtIpRwAt4VzurTwDqAt0mZ00AtJhtW7U` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_7078f44b2594653b818810ce7315726e516533ecf65e005c17a9b8c1690b652c` |
| Webhook URL | `https://chabaqa.io/api/payment/webhook/stripe` |

> Before real money: replace with `sk_live_...` and live `whsec_...` in `backend/.env`, then redeploy backend.

### Google OAuth

| Key | Value |
|-----|-------|
| Client ID | `946155038247-a12gnhogliomav60pegffq1qj23nkag6.apps.googleusercontent.com` |
| Client secret | `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` |
| Callback (prod) | `https://chabaqa.io/api/auth/google/callback` |

Ensure in [Google Cloud Console](https://console.cloud.google.com/) authorized redirect URIs include the callback above.

### SMTP (Gmail app password)

| Key | Value |
|-----|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `louay.rjili@issatm.ucar.tn` |
| `EMAIL_PASSWORD` | `nukeujipgserqjdx` |
| `EMAIL_FROM` | `noreply@chabaqa.io` |

### Web Push (VAPID)

| Key | Value |
|-----|-------|
| `WEB_PUSH_PUBLIC_KEY` | `BI8jtDo3S8UZH87PTB3Mj_aYmprDy-6Wtz5cYmaPMQ5Szp3WiTimHxbCKR2aJSfSiw6dijAq_AlK3iCkKSopb_I` |
| `WEB_PUSH_PRIVATE_KEY` | `hqhuZpbd5E61pt-HB-J55A4QFkSrnIWlG6v5VB0opXA` |

### Admin bootstrap

| Key | Value |
|-----|-------|
| `ADMIN_BOOTSTRAP_KEY` | `1bdc28efc3a9587818d19584cc1a62a88d972a2515ab55c7a64b5e5b828efebb` |

---

## 6. Deploy

```bash
cd /home/ubuntu/chabaqa
sudo BRANCH=main ./deploy.sh
```

What `deploy.sh` does:

1. `git reset --hard origin/main`
2. Mongo backup → `.deploy-backups/`
3. `docker compose build --pull`
4. Start `mongo`, `redis`, `clamav`
5. Recreate `chabaqa-backend`, `chabaqa-frontend` (pulls `minio`, `meilisearch`)
6. Start monitoring stack + Alertmanager
7. Reload Nginx
8. `verify-production.sh` + `smoke-production.sh`

**WhatsApp:** stays off (`WHATSAPP_ENABLED=false`). OpenWA needs `docker compose --profile whatsapp up -d openwa-api` only if you enable later.

---

## 7. Meilisearch index (after first deploy)

```bash
cd /home/ubuntu/chabaqa
MEILI_HOST=http://127.0.0.1:7700 \
MEILI_API_KEY=96ef479553141e82b864732bad5c22f718854e8f45ec999227147791149cfa4d \
MONGO_URI="mongodb://127.0.0.1:27017/chabaqa_local?replicaSet=rs0" \
node scripts/sync-meilisearch-index.js
```

```bash
curl -sS http://127.0.0.1:7700/health
curl -sS "https://chabaqa.io/api/search?q=test" | head -c 200
```

---

## 8. Verification

```bash
docker compose ps

curl -sS http://127.0.0.1:3000/api/health/ping
curl -sS http://127.0.0.1:3000/api/health
curl -sS -o /dev/null -w "%{http_code}\n" https://chabaqa.io/
curl -sS -o /dev/null -w "%{http_code}\n" https://chabaqa.io/status
curl -sS -o /dev/null -w "%{http_code}\n" https://chabaqa.io/api/health/ping

./scripts/verify-production.sh
DOMAIN=https://chabaqa.io ./scripts/smoke-production.sh
```

### Smoke test defaults (override if your prod slugs differ)

```bash
DOMAIN=https://chabaqa.io \
TEST_COMMUNITY_CREATOR=youssef-bouallegue \
TEST_COMMUNITY_SLUG=growth-operators-network \
./scripts/smoke-production.sh
```

### Manual feature checks

| Feature | URL / action |
|---------|----------------|
| Sign in + 2FA | https://chabaqa.io/signin |
| GDPR export | https://chabaqa.io/settings → Download my data |
| Search | https://chabaqa.io/search?q=course |
| Admin | https://chabaqa.io/admin |
| Status | https://chabaqa.io/status |
| Grafana | https://chabaqa.io/monitoring/grafana/ (admin / `ChabaqaGrafana2026!`) |

### Sentry check

After deploy, open Sentry project → Issues. Optionally:

```bash
curl -sS "https://chabaqa.io/api/health/ping" >/dev/null
docker logs chabaqa-backend 2>&1 | grep -i sentry | tail -5
```

### PagerDuty check (maintenance window only)

```bash
curl -sS http://127.0.0.1:9093/-/healthy
# docker stop chabaqa-backend  # wait 3 min → incident in PagerDuty EU
# docker start chabaqa-backend
```

---

## 9. Nightly Mongo backup cron

```bash
sudo crontab -e
```

```cron
0 3 * * * BACKUP_DIR=/home/ubuntu/chabaqa/.deploy-backups MONGO_URI='mongodb://127.0.0.1:27017/chabaqa_local?replicaSet=rs0' /home/ubuntu/chabaqa/scripts/backup-mongo.sh >> /var/log/chabaqa-backup.log 2>&1
```

---

## 10. Public URLs

| Service | URL |
|---------|-----|
| Site | https://chabaqa.io |
| API | https://chabaqa.io/api |
| Health | https://chabaqa.io/api/health |
| Status page | https://chabaqa.io/status |
| Grafana | https://chabaqa.io/monitoring/grafana/ |
| Prometheus | https://chabaqa.io/monitoring/prometheus/ |
| Alertmanager | https://chabaqa.io/monitoring/alertmanager/ |
| MinIO console | https://chabaqa.io/monitoring/storage/ |

---

## 11. Rollback

```bash
cd /home/ubuntu/chabaqa
git log --oneline -5
BRANCH=ff7642d sudo ./deploy.sh   # example: previous commit before production-readiness
```

Mongo restore (destructive):

```bash
ls -la .deploy-backups/
docker exec -i chabaqa-mongo mongorestore --archive --gzip --drop \
  < .deploy-backups/mongo-chabaqa_local-predeploy-XXXX.archive.gz
```

---

## 12. Troubleshooting

| Problem | Fix |
|---------|-----|
| `MEILI_MASTER_KEY must be set` | Re-run Section 4.1 root `.env` |
| Redis auth failed | Match `REDIS_PASSWORD` in root + backend `.env` |
| Frontend Sentry missing | `NEXT_PUBLIC_SENTRY_DSN` in root `.env` **before** `docker compose build` |
| Meilisearch unhealthy after key change | Wipe volume only if OK to reindex: `docker volume rm chabaqa_meili-data` |
| Stripe webhooks 400 | Update `STRIPE_WEBHOOK_SECRET` to match Stripe Dashboard for `https://chabaqa.io/api/payment/webhook/stripe` |
| Google OAuth redirect mismatch | Add prod callback in Google Console |
| `openwa-api` in deploy logs | Ignore if `WHATSAPP_ENABLED=false` |

---

## 13. Production toggles changed vs your local dev `.env`

| Setting | Local was | Production now |
|---------|-----------|----------------|
| `FREE_MODE` | `true` | `false` |
| `PLAN_ENFORCEMENT_MODE` | `false` | `true` |
| `SERVER_URL` / `FRONTEND_URL` | localhost | `https://chabaqa.io` |
| `MONGO_URI` | no replicaSet | `?replicaSet=rs0` |
| `REDIS_HOST` | `127.0.0.1` | `redis` (Docker service) |
| `ENABLE_SWAGGER` | `true` | `false` |
| `ADMIN_ALLOW_PASSWORD_ONLY_LOGIN` | `true` | `false` |
| Wallet/manual payment fallback | enabled | disabled (Stripe-only in compose) |

---

## 14. After deploy checklist

- [ ] `deploy.sh` exited 0
- [ ] `verify-production.sh` + `smoke-production.sh` passed
- [ ] Meilisearch index synced
- [ ] Sentry shows production environment
- [ ] Stripe test webhook delivered (Dashboard → Webhooks → Send test)
- [ ] Sign in + email OTP (2FA) works for creator
- [ ] Grafana login works
- [ ] Nightly backup cron added
- [ ] **Delete or secure this file** — do not commit to git

---

*Private ops doc — Louay / Chabaqa production VPS — 2026-07-02*
