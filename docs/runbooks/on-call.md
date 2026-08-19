# On-call rotation

## Escalation path

| Level | Role | Responsibility |
|-------|------|----------------|
| L1 | On-call engineer | Acknowledge alerts within 15 min, run triage runbooks |
| L2 | Backend lead | Deep debugging, deploy/rollback decisions |
| L3 | Infrastructure | VPS, Mongo Atlas, DNS/Cloudflare issues |

> Replace placeholder contacts below with your team's real names and channels.

## Contacts (fill in)

| Role | Name | Slack / phone | Hours |
|------|------|---------------|-------|
| Primary on-call | _TBD_ | `#chabaqa-alerts` | Mon–Sun 09:00–21:00 UTC+1 |
| Secondary on-call | _TBD_ | `#chabaqa-alerts` | Backup when primary unavailable |
| Finance / payments | _TBD_ | `#chabaqa-finance` | Stripe disputes, payout holds |

## Alert routing

Critical alerts (Alertmanager → PagerDuty EU):

- `BackendDown` → L1 immediately, escalate to L2 if not resolved in 30 min
- `HttpProbeFailing` → L1
- `HostLowDiskSpace` → L1 + L3
- `HostLowMemory` → L1; see [`high-memory.md`](high-memory.md)

Set `PAGERDUTY_ROUTING_KEY` and `PAGERDUTY_EVENTS_URL=https://events.eu.pagerduty.com/v2/enqueue` in root `.env`.

## First 15 minutes checklist

1. Acknowledge alert in Slack/PagerDuty.
2. Check public status: `https://chabaqa.io/status`
3. Check Grafana: `https://chabaqa.io/monitoring/grafana/`
4. Check Sentry for new error spike (if `SENTRY_DSN` configured).
5. Run the relevant runbook from [`docs/runbooks/`](./).
6. Post status update in `#chabaqa-alerts` every 30 min until resolved.

## Runbook index

- [Backend down](./backend-down.md)
- [Mongo down / replica set](./mongo-down.md)
- [Mongo migration](./mongo-migration.md)
- [Rollback deploy](./rollback.md)
- [Stripe webhooks](./stripe-webhooks.md)
- [High memory / OOM](./high-memory.md)
- [ClamAV uploads](./clamav-uploads.md)
- [Creator integrations](./creator-integrations.md)
