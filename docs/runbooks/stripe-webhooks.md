# Runbook: Stripe webhook failures

**Trigger:** Payments stuck in `pending`, Stripe dashboard shows failed webhook deliveries,
or `processed_webhook_events` collection stops growing.

## 1. Triage

```bash
docker compose logs --tail=300 chabaqa-backend | grep -i stripe
curl -sf http://127.0.0.1:3000/api/health/ping
```

In Stripe Dashboard → Developers → Webhooks → your endpoint:
- Check **Recent deliveries** for HTTP status codes (401/400/500).
- Confirm endpoint URL is `https://chabaqa.io/api/payment/stripe/webhook` (or your prod URL).

## 2. Common causes

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 / signature invalid | `STRIPE_WEBHOOK_SECRET` mismatch | Copy signing secret from Stripe dashboard into `backend/.env`, redeploy |
| 404 | Wrong webhook path or nginx routing | Verify nginx proxies `/api/*` to backend |
| 500 | Backend crash / Mongo down | See `backend-down.md`, `mongo-down.md` |
| Timeout | Backend slow under load | Check Grafana latency; scale or restart backend |

## 3. Replay events

1. Fix the root cause first (secret, routing, DB).
2. In Stripe Dashboard → Webhooks → select failed event → **Resend**.
3. Verify order/subscription updated in Mongo (`orders`, `subscriptions` collections).

## 4. Audit trail

Payment state changes are logged in `payment_audit_logs`. Support can trace:
- webhook event ID
- order ID
- before/after status

## 5. Prevention

- Keep `STRIPE_WEBHOOK_SECRET` in sync after rotating Stripe API keys.
- Monitor webhook failure rate in Stripe dashboard weekly.
- Include a Stripe test webhook in pre-launch checklist (`.github/ISSUE_TEMPLATE/launch-checklist.md`).
