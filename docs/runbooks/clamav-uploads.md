# Runbook: ClamAV blocking uploads

**Trigger:** Users/creators see upload failures; backend logs mention `clamav`, `virus`,
or `UPLOAD_MALWARE_SCANNING`.

## 1. Triage

```bash
docker compose ps clamav
docker compose logs --tail=200 clamav chabaqa-backend | grep -i clam
```

ClamAV can take **5–10 minutes** on first boot while downloading virus definitions
(`start_period: 300s` in compose).

## 2. Common causes

| Cause | Fix |
|-------|-----|
| ClamAV still starting | Wait for healthy status: `docker compose ps clamav` |
| ClamAV OOM / crashed | `docker compose restart clamav`; check memory limits |
| False positive on legitimate file | Quarantine file, report signature; temporarily set `UPLOAD_MALWARE_SCANNING=optional` **only on staging** |
| ClamAV unreachable from backend | Verify `CLAMAV_HOST=clamav`, `CLAMAV_PORT=3310` in backend env |

## 3. Mitigate

```bash
docker compose restart clamav
# After healthy:
docker compose restart chabaqa-backend
```

For **local dev only** (never production):

```bash
# backend/.env
UPLOAD_MALWARE_SCANNING=optional
```

Production must keep `UPLOAD_MALWARE_SCANNING=required` (set in `docker-compose.yml`).

## 4. Verify

Upload a small PNG/PDF through the creator dashboard or API. Confirm:
- File lands in MinIO / `uploads/`
- No 422/500 from malware scan middleware

## 5. Prevention

- Do not disable ClamAV in production compose.
- Monitor `clamav` container health in Prometheus/Grafana.
- Keep ClamAV image updated on a schedule.
