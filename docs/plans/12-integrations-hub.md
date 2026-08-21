# Plan 12: Integrations Hub (Zapier, Slack, CRM)

**Status:** Draft  
**Priority:** P2 (Wave 3)  
**Competitive parity:** Circle/Zapier, Disco integrations, Skool Zapier  
**Current:** `frontend/app/(creator)/creator/integrations/page.tsx` — static mock catalog

---

## 1. Objectives

1. Replace placeholder integrations page with **working connections**.
2. **Outbound webhooks** for Chabaqa events (foundation for Zapier).
3. **Inbound webhooks** / Zapier triggers (member joined, order paid).
4. First-party: **Slack** notifications, **Google Calendar** (extend existing), **Mailchimp** sync (v2).
5. OAuth connection management UI.

---

## 2. Current state

| Integration | State |
|-------------|--------|
| Integrations page UI | ✅ Static list, all coming-soon |
| Google Calendar API | ✅ `google-calendar.api.ts` (sessions) |
| Zapier | ❌ |
| Outbound webhooks | ❌ |
| OAuth token storage | ❌ Generic |

---

## 3. Target UX

### 3.1 Integrations hub

Route: `/creator/integrations`

**Sections:**
- **Connected** — active integrations with health status
- **Browse** — categorized catalog
- **Webhooks** — custom endpoints
- **API & developers** — link to Plan 10

### 3.2 Connection flow

1. Click **Connect** on Zapier → OAuth or API key instructions
2. Configure triggers/actions mapping (Zapier UI) OR native Slack channel picker

### 3.3 Design: **“Tool bench”**

- Light grid of integration cards with **real logos** (not generic icons only).
- Connected state: green left border + “Connected” pill.
- Webhook section: terminal-style URL display with copy button.
- Avoid cluttered marketplace; emphasize **5 working** integrations over 20 fake ones.

---

## 4. Architecture

### 4.1 Core primitives

```
IntegrationConnection     # OAuth tokens per creator
WebhookSubscription       # outbound URLs (shared with Plan 10)
IntegrationEventBus       # internal emit on domain events
ZapierApp                 # Zapier Platform CLI app (separate repo folder)
```

### 4.2 Event bus

Emit from existing services (decorator or explicit call):

```typescript
integrationEvents.emit('member.joined', {
  communityId, userId, email, joinedAt
});
```

**Standard events (v1):**

| Event | Source service |
|-------|----------------|
| `member.joined` | communities join |
| `member.left` | subscription cancel |
| `order.paid` | payment fulfillment |
| `order.refunded` | payment |
| `course.completed` | progression |
| `challenge.completed` | challenge |
| `post.created` | post |
| `support.ticket.created` | live-support |

---

## 5. Data models

### `IntegrationConnection`

```typescript
creatorId: ObjectId
provider: 'zapier' | 'slack' | 'google_calendar' | 'mailchimp' | 'custom_webhook'
status: 'connected' | 'disconnected' | 'error'
credentialsEncrypted: string     // JSON blob
config: Record<string, any>      // channel id, list id, etc.
scopes: string[]
lastSyncAt?: Date
errorMessage?: string
```

### `WebhookSubscription` (same as Plan 10)

```typescript
creatorId: ObjectId
communityId?: ObjectId
url: string
secret: string
events: string[]
status: 'active' | 'paused'
failureCount: number
```

### `WebhookDeliveryLog`

```typescript
subscriptionId, event, payload, responseStatus, durationMs, createdAt
```

---

## 6. Backend

### 6.1 Module

```
backend/src/domains/platform/integrations/
  integrations.module.ts
  integrations.controller.ts
  integration-connection.service.ts
  webhook-dispatcher.service.ts
  integration-event.listener.ts
  providers/
    slack.provider.ts
    zapier.provider.ts
    google-calendar.provider.ts   # migrate existing
```

### 6.2 APIs

| Method | Path |
|--------|------|
| GET | `/integrations/catalog` | Available integrations + connection status |
| GET | `/integrations/connections` |
| POST | `/integrations/connections/:provider/connect` | Start OAuth |
| GET | `/integrations/oauth/callback/:provider` |
| DELETE | `/integrations/connections/:id` |
| CRUD | `/integrations/webhooks` |
| POST | `/integrations/webhooks/:id/test` |
| GET | `/integrations/webhooks/:id/deliveries` |

### 6.3 Webhook dispatcher

```typescript
async dispatch(event: string, payload: object) {
  const subs = await findActive(event);
  for (const sub of subs) {
    const body = JSON.stringify({ event, data: payload, timestamp });
    const sig = hmacSha256(sub.secret, body);
    await fetch(sub.url, {
      headers: { 'Chabaqa-Signature': sig, 'Content-Type': 'application/json' },
      body,
    });
    // log delivery, retry 3x exponential backoff
  }
}
```

### 6.4 Slack provider

**Actions:**
- Post to `#channel` on `order.paid`, `member.joined`, `support.ticket.created`

**OAuth:** Slack app with `chat:write`, `incoming-webhook`

**Creator config:** Pick channel from dropdown after connect

### 6.5 Zapier

**Approach A (faster):** Webhooks by Zapier — document Chabaqa webhooks + API key (Plan 10)

**Approach B (better UX):** Official Zapier Integration using Zapier Platform CLI

```
integrations/zapier/
  index.js
  triggers/member_joined.js
  triggers/order_paid.js
  actions/create_member.js   # requires API key auth
```

Publish as **Chabaqa** app on Zapier.

**Auth:** API key from Plan 10 passed to Zapier connection.

### 6.6 Google Calendar

Refactor existing calendar code into `providers/google-calendar.provider.ts`:
- Register in connections table
- Show as **Connected** when token valid

### 6.7 Mailchimp (v2)

OAuth + sync community members to audience on `member.joined`.

---

## 7. Frontend

### 7.1 Refactor integrations page

`integrations/page.tsx`:
- Fetch `GET /integrations/catalog`
- Dynamic status badges from API
- Connect buttons launch OAuth popup

### 7.2 New pages

```
/creator/integrations/webhooks
/creator/integrations/webhooks/new
/creator/integrations/slack/setup
```

### 7.3 Components

- `IntegrationCard.tsx`
- `WebhookForm.tsx`
- `DeliveryLogTable.tsx`
- `OAuthConnectButton.tsx`

### 7.4 API

`frontend/lib/api/integrations.api.ts`

---

## 8. Security

- Encrypt OAuth tokens at rest (same as WhatsApp/Meta pattern)
- Webhook secrets: `crypto.randomBytes(32)`
- Validate outbound URLs (no private IP ranges — SSRF protection)
- Zapier only over HTTPS

---

## 9. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Event bus + webhook CRUD + dispatcher |
| 2 | Integrations UI wired; test webhook button |
| 3 | Slack OAuth + notifications |
| 4 | Google Calendar shown as managed connection |
| 5 | Zapier app (triggers) + documentation |
| 6 | Mailchimp sync |

---

## 10. Acceptance criteria

- [ ] Creator adds webhook; `member.joined` delivers signed payload
- [ ] Failed webhook retries and shows in delivery log
- [ ] Slack receives message on new order
- [ ] Integrations page shows real Connected state (not mock)
- [ ] Disconnect revokes tokens and stops events

---

## 11. Plan gating

```typescript
webhooksMax: number              // growth: 1, pro: 10
integrationsEnabled: string[]    // provider allowlist per tier
```

---

## 12. Documentation

- `docs/integrations/webhooks.md` — event payloads, signature verification
- `docs/integrations/zapier.md` — setup guide
- Postman collection for webhook test payloads

---

## 13. Dependencies

- **Plan 10:** API keys for Zapier actions
- **Plan 07:** Optional segment export trigger
- **Plan 01:** AI-generated webhook test payloads (nice-to-have)

---

## 14. Files

**Create:**
- `backend/src/domains/platform/integrations/*`
- `schemas/platform/integration-connection.schema.ts`
- `schemas/platform/webhook-subscription.schema.ts`
- `integrations/zapier/` (CLI app)
- `frontend/app/(creator)/creator/integrations/webhooks/**`

**Modify:**
- `integrations/page.tsx` (remove hardcoded mock)
- `payment-fulfillment.service.ts`, join flows — emit events
- `dashboard-sidebar.tsx` — Integrations submenu
