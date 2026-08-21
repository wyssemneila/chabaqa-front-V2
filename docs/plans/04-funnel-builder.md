# Plan 04: Built-in Funnel Builder

**Status:** Draft  
**Priority:** P1 (Wave 2)  
**Competitive parity:** Kajabi funnels, Nas.io storefront flow  
**Related:** `creator/analytics` funnels (analytics only, not page builder), `email-campaign.schema.ts`, checkout pages

---

## 1. Objectives

1. Visual **funnel builder**: Opt-in → Sales page → Checkout → Thank you → Email sequence.
2. Connect to existing **checkout** (`community/[slug]/checkout`, payment init routes).
3. Track funnel steps in **content-tracking** / analytics (reuse `TrackingAction`).
4. AI generates funnel copy (Plan 01).

---

## 2. Current state

| Capability | State |
|------------|--------|
| Analytics funnel charts | ✅ Creator analytics `getFunnel` |
| Email campaigns | ✅ `email-campaign.schema.ts` |
| Standalone landing pages | ✅ Community customize |
| Multi-step funnel entity | ❌ |
| Page builder blocks | ⚠️ Community `community-page-content` partial |

---

## 3. Target UX

### 3.1 Funnel types (templates)

| Template | Steps |
|----------|-------|
| **Community join** | Lead magnet page → Checkout → Welcome email sequence |
| **Course launch** | Sales page → Checkout → Onboarding emails |
| **Challenge** | Registration → Paid upgrade → Challenge start emails |
| **Lead capture only** | Opt-in → Thank you → Nurture sequence |

### 3.2 Design: **“Pipeline blueprint”**

- Horizontal **node graph** (not generic flowchart clipart): nodes are rounded cards on a subtle grid.
- Active step glows with community primary color.
- Right inspector panel for step settings (like Webflow-lite).
- Preview mode: full-width device frame.

### 3.3 Routes

```
/creator/marketing/funnels
/creator/marketing/funnels/new
/creator/marketing/funnels/[funnelId]/edit
/f/[funnelSlug]                    → public step router (landing layout)
/f/[funnelSlug]/checkout           → may redirect to existing checkout
/f/[funnelSlug]/thank-you
```

---

## 4. Data models

### `Funnel`

```typescript
creatorId: ObjectId
communityId: ObjectId
name: string
slug: string                    // unique globally: /f/{slug}
status: 'draft' | 'published' | 'archived'
goal: 'community_join' | 'course_sale' | 'product_sale' | 'lead_capture'
targetContentType?: string
targetContentId?: string
steps: FunnelStep[]             // ordered
settings: {
  primaryColor?: string
  customDomain?: string         // v2
  metaTitle?, metaDescription?
}
analytics: { views, optIns, checkouts, conversions }
```

### `FunnelStep`

```typescript
id: string
type: 'landing' | 'checkout' | 'thank_you' | 'upsell' | 'redirect'
order: number
config: LandingStepConfig | CheckoutStepConfig | ThankYouStepConfig

// LandingStepConfig
blocks: PageBlock[]              // reuse community page block types

// CheckoutStepConfig
checkoutMode: 'community' | 'course' | 'product' | ...
contentId: string
paymentMethods?: ('stripe')[]

// ThankYouStepConfig
redirectUrl?: string
showNextSteps?: boolean
```

### `FunnelEnrollment` (visitor progress)

```typescript
funnelId: ObjectId
visitorId: string               // cookie uuid
userId?: ObjectId
currentStepId: string
completedSteps: string[]
email?: string                  // after opt-in
utm?: Record<string, string>
```

### `FunnelEmailSequence`

```typescript
funnelId: ObjectId
trigger: 'opt_in' | 'purchase' | 'abandoned_checkout'
emails: [{ delayHours, subject, bodyHtml, campaignId? }]
```

Link to existing `EmailCampaign` for send execution.

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/marketing/funnel/
  funnel.controller.ts
  funnel.service.ts
  funnel-public.controller.ts     # no auth, rate limited
  funnel-tracking.service.ts
  funnel-email.service.ts
```

### 5.2 APIs

**Creator (auth):**

| Method | Path |
|--------|------|
| CRUD | `/funnels` |
| POST | `/funnels/:id/publish` |
| POST | `/funnels/:id/duplicate` |
| GET | `/funnels/:id/analytics` |

**Public:**

| Method | Path |
|--------|------|
| GET | `/public/funnels/:slug` | Step payload for SSR |
| POST | `/public/funnels/:slug/track` | Step events |
| POST | `/public/funnels/:slug/opt-in` | Capture email → enrollment |

### 5.3 Checkout integration

Do **not** duplicate payment logic. `CheckoutStepConfig` returns:

```json
{
  "redirectTo": "/community/{slug}/checkout?funnelId=...&stepId=...",
  "initEndpoint": "/payment/stripe-link/init/course",
  "contentId": "..."
}
```

Frontend public funnel page redirects to existing checkout with query params; `payment.controller` records `funnelId` on `Order.metadata`.

Extend `order.schema.ts`:

```typescript
metadata?: {
  funnelId?: ObjectId
  funnelStepId?: string
  utm?: Record<string, string>
}
```

### 5.4 Abandoned checkout automation

Cron: find `FunnelEnrollment` where checkout started >1h ago, no paid order → trigger email sequence.

---

## 6. Frontend

### 6.1 Builder

`frontend/app/(creator)/creator/marketing/funnels/[funnelId]/edit/`
- `FunnelCanvas.tsx` — step nodes
- `StepInspector.tsx`
- `BlockEditor.tsx` — reuse blocks from `community-page-content` components

### 6.2 Public renderer

`frontend/app/(landing)/f/[slug]/page.tsx`
- SSR fetch public funnel
- Render blocks
- Track page view via `tracking.api.ts`

### 6.3 API

`frontend/lib/api/funnels.api.ts`

---

## 7. Page block types (reuse)

Align with `LongDescriptionElement` / community customize:
- `hero`, `text`, `image`, `video`, `testimonials`, `pricing_table`, `faq`, `cta_button`, `countdown` (v2)

---

## 8. Phases

| Phase | Scope |
|-------|-------|
| 1 | Schema + CRUD + simple 2-step (landing → checkout redirect) |
| 2 | Thank you + basic analytics |
| 3 | Email sequence triggers |
| 4 | Visual block editor + templates |
| 5 | Abandoned cart + AI copy (Plan 01) |

---

## 9. Acceptance criteria

- [ ] Creator publishes funnel; public URL loads landing
- [ ] CTA navigates to working checkout; successful payment marks conversion
- [ ] Funnel analytics show drop-off per step
- [ ] Opt-in triggers welcome email via existing email service
- [ ] Plan: Growth+ funnels limit (e.g. 3 active on Growth, unlimited Pro)

---

## 10. Plan gating

```typescript
funnelsMax: number;              // starter: 0, growth: 3, pro: unlimited
funnelEmailsPerMonth: number;
```

---

## 11. Files

**Create:** `domains/marketing/funnel/*`, `schemas/marketing/funnel.schema.ts`  
**Modify:** `payment.controller.ts` (metadata), `order.schema.ts`, `creator/marketing/emails`, analytics aggregation
