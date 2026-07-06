# Plan 10: Headless Member API + SSO

**Status:** Draft  
**Priority:** P2 (Wave 3)  
**Competitive parity:** Circle Business (Headless Member API, Admin API, SSO)  
**Foundation:** JWT auth (`passport-jwt`), `user.schema.ts`, `communities.controller.ts`

---

## 1. Objectives

1. **Headless Member API** — external apps consume community data with API keys (read member profile, posts, courses enrollment).
2. **Admin API** — server-to-server community management (members, content publish).
3. **SSO** — enterprise creators use OIDC/SAML (Google Workspace, Azure AD).
4. Maintain strict **tenant isolation** per community.

---

## 2. Current state

| Item | State |
|------|--------|
| User JWT auth | ✅ |
| Google OAuth (user login) | ✅ |
| Public REST for web app | ✅ Monolithic controllers |
| API keys for creators | ❌ |
| OAuth2 client credentials | ❌ |
| SAML/OIDC SSO for communities | ❌ |
| Rate limiting per API key | ⚠️ May exist globally |

---

## 3. Architecture overview

```
External App                    Chabaqa API Gateway
     │                                │
     │  Bearer: chq_live_xxx          │
     ├──────────────────────────────►│ api/v1/headless/*
     │                                │
     │  SSO OIDC                      │ auth/sso/callback
     └──────────────────────────────►│ issues member JWT
```

**Versioning:** `/api/v1/` prefix (new routes only; do not break existing `/auth`, `/communities`).

---

## 4. Data models

### `ApiKey`

```typescript
creatorId: ObjectId
communityId?: ObjectId         // scoped or null for creator-wide
name: string
keyPrefix: string              // chq_live_abc (display)
keyHash: string                // bcrypt hash of secret
scopes: ApiScope[]
rateLimitPerMinute: number
lastUsedAt?: Date
expiresAt?: Date
status: 'active' | 'revoked'
```

### `ApiScope` enum

```
members:read
members:write
posts:read
posts:write
courses:read
enrollments:read
enrollments:write
webhooks:manage
```

### `SsoConnection`

```typescript
communityId: ObjectId
provider: 'oidc' | 'saml'
issuerUrl: string
clientId: string
clientSecretEncrypted: string
metadataXml?: string            // SAML
attributeMapping: {
  email: string
  firstName?: string
  lastName?: string
}
defaultRole: 'member'
jitProvisioning: boolean
status: 'active' | 'disabled'
```

### `SsoSession`

```typescript
communityId, userId, externalSubjectId, createdAt
```

---

## 5. Headless Member API

### 5.1 Authentication

Header: `Authorization: Bearer chq_live_{secret}`

Middleware `ApiKeyGuard`:
1. Parse key → lookup hash
2. Check scopes for route
3. Attach `creatorId`, `communityId` to request
4. Rate limit via Redis

### 5.2 Endpoints (v1)

| Method | Path | Scope |
|--------|------|-------|
| GET | `/api/v1/communities/:slug` | public key optional |
| GET | `/api/v1/communities/:slug/members` | members:read |
| GET | `/api/v1/members/:id` | members:read |
| POST | `/api/v1/members` | members:write (invite/create) |
| GET | `/api/v1/posts` | posts:read |
| POST | `/api/v1/posts` | posts:write |
| GET | `/api/v1/courses` | courses:read |
| GET | `/api/v1/members/:id/enrollments` | enrollments:read |
| POST | `/api/v1/members/:id/enrollments` | enrollments:write |

Responses: JSON API style `{ data, meta }`.

### 5.3 Webhooks (outbound)

Creators register URLs:

```typescript
WebhookSubscription {
  apiKeyId, url, events: ['member.joined', 'order.paid', ...], secret
}
```

Deliver with HMAC-SHA256 signature header `Chabaqa-Signature`.

---

## 6. Admin API

Separate key type `chq_admin_` with elevated scopes for creator automation:

| Method | Path |
|--------|------|
| POST | `/api/v1/admin/communities/:id/members/bulk` |
| PATCH | `/api/v1/admin/courses/:id/publish` |
| GET | `/api/v1/admin/analytics/overview` |

Requires `admin` scope on API key + creator ownership verification.

---

## 7. SSO implementation

### 7.1 OIDC (phase 1)

**Routes:**
- `GET /auth/sso/:communitySlug/login` → redirect to IdP
- `GET /auth/sso/:communitySlug/callback` → exchange code, map user, issue JWT

Use `openid-client` npm package.

**JIT provisioning:** Create user if email not found + `jitProvisioning=true`.

### 7.2 SAML (phase 2)

Use `@node-saml/node-saml` for enterprise.

### 7.3 Member experience

Community login page shows **“Sign in with SSO”** when `SsoConnection` active.

---

## 8. Frontend (creator)

### 8.1 Routes

```
/creator/settings/api-keys
/creator/settings/api-keys/new
/creator/community/[slug]/settings/sso
/creator/settings/webhooks
```

### 8.2 Design: **“Developer terminal”**

- Dark code-panel aesthetic for API keys (monospace, copy buttons).
- Scope checkboxes as compact chips.
- SSO config wizard with step validation (test connection button).

### 8.3 Docs

Embed OpenAPI spec at `/developer` or link to `docs/api/openapi-headless.yaml`.

---

## 9. Security requirements

- API secrets shown **once** on creation
- Keys rotatable without downtime (two active keys)
- SSO state parameter CSRF protection
- Audit log all API key usage (`audit-log.schema.ts` pattern)
- IP allowlist optional on Pro plan

---

## 10. Plan gating

```typescript
headlessApiEnabled: boolean       // Pro+
ssoEnabled: boolean               // Pro+ or Enterprise
apiKeysMax: number
webhooksMax: number
```

---

## 11. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | ApiKey model + keys UI + 3 read endpoints |
| 2 | Write endpoints + webhooks outbound |
| 3 | OIDC SSO |
| 4 | OpenAPI docs + SDK snippet generator |
| 5 | SAML + Admin API bulk |

---

## 12. Acceptance criteria

- [ ] Creator generates API key; external curl fetches member list
- [ ] Revoked key returns 401
- [ ] Scope violation returns 403
- [ ] OIDC SSO login creates session for member
- [ ] Webhook fires on `member.joined` with valid signature

---

## 13. Files

**Create:**
- `backend/src/domains/platform/api-keys/*`
- `backend/src/domains/platform/sso/*`
- `backend/src/domains/platform/webhooks/*`
- `backend/src/api/v1/headless/*` (or versioned controllers)
- `frontend/app/(creator)/creator/settings/api-keys/*`

**Modify:**
- `auth.module.ts`, login pages for community slug SSO button
- Rate limiting middleware
