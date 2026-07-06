# Plan 02: WhatsApp Deep Integration & Broadcast (Magic Reach)

**Status:** Draft  
**Priority:** P1 (Wave 2 — MENA differentiator)  
**Competitive parity:** Nas.io Magic Reach, WhatsApp monetization  
**Related code:** `plan-config.ts` (whatsappMessagesPerMonth), `creator/marketing/whatsapp/page.tsx` (placeholder)

---

## 1. Objectives

1. Connect creator WhatsApp Business accounts to Chabaqa.
2. Send **template-based broadcasts** to community members who opted in (phone on file).
3. Sync inbound messages to creator inbox (optional v2).
4. Enforce **`whatsappMessagesPerMonth`** via `PolicyService` (quota exists but unused).
5. Integrate with AI Cofounder (Plan 01) for copy generation.

---

## 2. Current state

| Item | State |
|------|--------|
| `whatsappMessagesPerMonth` in plans | ✅ Starter: 0, Growth: 250, Pro: 1000 |
| `PolicyService` quota type `whatsapp` | ✅ Defined |
| Actual send implementation | ❌ None |
| Creator UI | ❌ `marketing/whatsapp/page.tsx` = coming soon |
| Member phone field | ⚠️ Verify `user.schema.ts` / profile |
| Post share `wa.me` links | ✅ `post.service.ts` only |

---

## 3. Target experience

### 3.1 Creator flows

1. **Connect** WhatsApp Business via Meta Embedded Signup (or manual API token for enterprise).
2. **Sync templates** from Meta (approved message templates).
3. **Compose broadcast:** pick audience segment → pick template → variables → preview → schedule/send.
4. **View delivery:** sent, delivered, read, failed (webhook).
5. **AI assist:** “Generate broadcast copy” → prefill template variables (links to Plan 01).

### 3.2 Member flows

1. Opt-in checkbox at community join / profile settings (GDPR-style consent).
2. Receive WhatsApp message with unsubscribe keyword handling.

---

## 4. Design specification

### 4.1 Aesthetic: **“Message atelier”**

- Warm paper texture background on compose screen; phone mockup preview center-right.
- Template variables as **labeled chips** that snap into message preview.
- Status timeline vertical (Sent → Delivered → Read) with subtle green progression.
- Avoid generic chat UI clones; emphasize **broadcast control panel** not 1:1 chat.

### 4.2 Pages

| Route | Purpose |
|-------|---------|
| `/creator/marketing/whatsapp` | Connection status + broadcasts list |
| `/creator/marketing/whatsapp/connect` | OAuth / token setup |
| `/creator/marketing/whatsapp/broadcasts/new` | Composer |
| `/creator/marketing/whatsapp/broadcasts/[id]` | Stats |

---

## 5. Architecture

### 5.1 Provider

**Primary:** Meta WhatsApp Cloud API (Graph API v19+)

**Alternative:** Twilio WhatsApp (fallback for regions Meta blocks)

**Abstraction:**

```
backend/src/infrastructure/external/whatsapp/
  whatsapp-provider.interface.ts
  meta-whatsapp.provider.ts
  twilio-whatsapp.provider.ts
```

### 5.2 Data models

#### `WhatsAppConnection`

```typescript
creatorId: ObjectId
communityId?: ObjectId          // optional per-community WABA
provider: 'meta' | 'twilio'
wabaId: string
phoneNumberId: string
accessTokenEncrypted: string    // AES via existing secrets pattern
tokenExpiresAt?: Date
status: 'connected' | 'disconnected' | 'error'
webhookVerifyToken: string
createdAt, updatedAt
```

#### `WhatsAppTemplate`

```typescript
connectionId: ObjectId
metaTemplateId: string
name: string
language: string
category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
components: MetaComponent[]     // store raw from API
status: 'approved' | 'pending' | 'rejected'
```

#### `WhatsAppBroadcast`

```typescript
communityId: ObjectId
creatorId: ObjectId
templateId: ObjectId
variableMapping: Record<string, string>
audienceFilter: {
  type: 'all_members' | 'segment' | 'manual_ids'
  segment?: 'inactive_7d' | 'new_members' | 'completed_course'
  userIds?: ObjectId[]
}
scheduledAt?: Date
status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
stats: { targeted, sent, delivered, read, failed }
policyUsageCounted: number
```

#### `WhatsAppMessageLog`

```typescript
broadcastId: ObjectId
userId: ObjectId
phoneE164: string
waMessageId?: string
status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
errorCode?: string
```

#### Extend `User` / member profile

```typescript
phoneE164?: string
whatsappOptIn: boolean
whatsappOptInAt?: Date
whatsappOptInCommunityIds: ObjectId[]
```

---

## 6. Backend implementation

### 6.1 Module

```
backend/src/domains/communication/whatsapp/
  whatsapp.module.ts
  whatsapp-connection.controller.ts
  whatsapp-broadcast.controller.ts
  whatsapp-webhook.controller.ts
  whatsapp-connection.service.ts
  whatsapp-broadcast.service.ts
  whatsapp-audience.service.ts
```

### 6.2 API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/whatsapp/connection` | Creator connection status |
| POST | `/whatsapp/connection/meta/callback` | OAuth callback |
| DELETE | `/whatsapp/connection` | Disconnect |
| GET | `/whatsapp/templates` | List synced templates |
| POST | `/whatsapp/templates/sync` | Pull from Meta |
| POST | `/whatsapp/broadcasts` | Create draft |
| POST | `/whatsapp/broadcasts/:id/send` | Enqueue send |
| GET | `/whatsapp/broadcasts` | List |
| GET | `/whatsapp/broadcasts/:id` | Detail + stats |
| POST | `/webhooks/whatsapp` | Meta status callbacks |

### 6.3 Send pipeline

1. `assertQuota(creatorId, 'whatsapp', recipientCount)`.
2. Resolve audience → list of `{ userId, phoneE164 }` where `whatsappOptIn === true`.
3. Chunk recipients (Meta rate limits ~80 msg/sec per number).
4. Queue job `WhatsAppSendBatchJob` (BullMQ recommended).
5. For each: `POST /{phoneNumberId}/messages` with template payload.
6. Update logs from webhooks (`messages`, `message_template_status_update`).
7. Increment usage in `PolicyService`.

### 6.4 Audience segments (`WhatsAppAudienceService`)

Reuse:
- `content-tracking.service.ts` for inactive members
- `communities.service.ts` member list
- Plan 07 scores when available (`churn_risk` segment)

### 6.5 Webhook security

- Verify `X-Hub-Signature-256` with app secret
- Idempotency via `processed-webhook-event.schema.ts` pattern

### 6.6 Environment

```bash
META_APP_ID=
META_APP_SECRET=
META_WHATSAPP_CONFIG_ID=        # Embedded signup
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_TOKEN_ENCRYPTION_KEY=
WHATSAPP_PROVIDER=meta          # meta|twilio
```

---

## 7. Frontend implementation

### 7.1 Replace placeholder page

Refactor `frontend/app/(creator)/creator/marketing/whatsapp/page.tsx`:
- Connection card (green connected / amber disconnected)
- Broadcasts table
- CTA “New broadcast”

### 7.2 Components

- `WhatsAppConnectButton` — launches Meta embedded signup popup
- `TemplatePicker` — lists approved templates
- `AudienceSegmentSelect` — chips for segments
- `MessagePreviewPhone` — visual preview
- `BroadcastStatsChart` — delivery funnel

### 7.3 Member opt-in

- `community-join-checkout-section.tsx` — checkbox + phone field
- `/settings` — manage opt-in per community

### 7.4 API

`frontend/lib/api/whatsapp.api.ts`

---

## 8. Phased delivery

### Phase 1 (2 weeks)
- [ ] Meta app + webhook endpoint in staging
- [ ] `WhatsAppConnection` + connect UI
- [ ] Template sync (read-only list)

### Phase 2 (2 weeks)
- [ ] Broadcast draft + manual recipient test (creator’s own phone)
- [ ] Quota enforcement
- [ ] Basic logs

### Phase 3 (2 weeks)
- [ ] Audience segments (all members, new, inactive)
- [ ] Scheduled sends
- [ ] Stats dashboard

### Phase 4 (2 weeks)
- [ ] AI-generated template variables (Plan 01)
- [ ] Opt-in on join flow
- [ ] Twilio fallback provider

---

## 9. Compliance & legal

- Explicit opt-in text (AR/FR/EN) stored with timestamp
- Unsubscribe: handle `STOP` keyword via webhook auto-reply
- Tunisia/MENA: document data residency; phone numbers encrypted at rest
- Meta template approval lead time (24–72h) — UI must explain

---

## 10. Acceptance criteria

- [ ] Growth plan creator can connect WABA and send template broadcast to ≥1 opted-in member
- [ ] Quota blocks send when `whatsappMessagesPerMonth` exceeded with clear error
- [ ] Webhook updates message status within 60s
- [ ] Non-opted-in members never receive messages
- [ ] Disconnect revokes token and stops scheduled broadcasts

---

## 11. Dependencies

- **Requires:** Member phone + opt-in fields
- **Enhances:** Plan 01 (AI copy), Plan 04 (funnel follow-up), Plan 07 (segments)
- **Optional:** Plan 12 (Zapier trigger on broadcast completed)
