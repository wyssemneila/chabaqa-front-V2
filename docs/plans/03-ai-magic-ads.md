# Plan 03: AI Magic Ads / Paid Acquisition

**Status:** Draft  
**Priority:** P2 (Wave 3)  
**Competitive parity:** Nas.io Magic Ads  
**Dependencies:** Plan 01 (AI copy), Plan 08 (landing URLs), Meta Business account

---

## 1. Objectives

1. Let creators launch **Facebook/Instagram** campaigns from Chabaqa in ≤5 clicks.
2. AI generates **ad creative + copy** from product/community context (like Nas “single photo”).
3. Track spend, impressions, clicks, conversions (pixel/API).
4. Do **not** store card credentials — billing via Meta ad account.

---

## 2. Current state

- No Meta Marketing API integration
- No ad schema
- Community/product pages can serve as landing URLs
- AI create can generate marketing copy (unconnected)

---

## 3. Target UX

### 3.1 Flow

```
Select offer (community / course / product)
  → Upload image OR pick from media library
  → AI suggests: headline, primary text, CTA, audience interest tags
  → Set daily budget + duration (TND/USD)
  → Review Meta policy checklist
  → Launch (creates Campaign → AdSet → Ad in PAUSED then ACTIVE)
  → Dashboard: spend, CTR, purchases (if pixel fires)
```

### 3.2 Design: **“Campaign darkroom”**

- Dark UI panel (`stone-900`) with **single spotlight** on ad preview card (Facebook feed mockup).
- Budget slider with large numerals; amber accent for spend warnings.
- One hero animation: preview card flips when AI regenerates copy.

### 3.3 Routes

| Route | Purpose |
|-------|---------|
| `/creator/marketing/ads` | Campaign list |
| `/creator/marketing/ads/new` | Wizard |
| `/creator/marketing/ads/[id]` | Performance |

---

## 4. Data models

### `MetaAdConnection`

```typescript
creatorId: ObjectId
adAccountId: string
accessTokenEncrypted: string
pageId?: string
instagramActorId?: string
pixelId?: string
status: 'connected' | 'disconnected'
```

### `AdCampaign`

```typescript
creatorId: ObjectId
communityId: ObjectId
contentType: 'community' | 'course' | 'product' | 'challenge' | 'event'
contentId: string
metaCampaignId: string
metaAdSetId: string
metaAdId: string
name: string
status: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected'
budget: { dailyAmount: number; currency: string; days: number }
creative: {
  imageMediaAssetId?: ObjectId
  headline: string
  primaryText: string
  cta: 'LEARN_MORE' | 'SIGN_UP' | 'SHOP_NOW'
  landingUrl: string
}
aiMetadata?: { model, promptVersion }
metrics: { spend, impressions, clicks, conversions, lastSyncedAt }
```

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/marketing/ads/
  meta-ads.provider.ts          # Marketing API wrapper
  ads-connection.service.ts
  ads-campaign.service.ts
  ads-ai-creative.service.ts    # uses OpenRouter + offer context
  ads-metrics-sync.service.ts   # cron every 15min
```

### 5.2 APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ads/connection` | Status |
| GET | `/ads/oauth/meta/start` | Redirect |
| GET | `/ads/oauth/meta/callback` | Token |
| POST | `/ads/campaigns/generate-creative` | AI only |
| POST | `/ads/campaigns` | Create + submit to Meta |
| GET | `/ads/campaigns` | List |
| PATCH | `/ads/campaigns/:id/pause` | |
| POST | `/ads/campaigns/:id/sync-metrics` | Manual refresh |

### 5.3 AI creative service

**Input:** `contentType`, `contentId`, optional `imageDescription`

**Context loading:**
- Pull title, description, price, community branding from respective services
- MENA-aware copy instruction in system prompt (AR/FR/EN per creator setting)

**Output (validated JSON):**

```json
{
  "headline": "max 40 chars",
  "primaryText": "max 125 chars",
  "interestTags": ["..."],
  "suggestedBudgetTND": { "min": 10, "recommended": 30 }
}
```

### 5.4 Meta API integration notes

- Permissions: `ads_management`, `pages_read_engagement`, `business_management`
- Create campaign in `OUTCOME_SALES` or `OUTCOME_TRAFFIC`
- Use **existing community checkout URL** as `link_data.link`
- Conversions: Meta Pixel on `community/[slug]/checkout` + `Purchase` event on `payment-success`

### 5.5 Plan gating

```typescript
// plan.schema.ts
magicAdsEnabled: boolean;        // Growth: false, Pro: true
magicAdsActiveCampaignsMax: number;
magicAdsAiCreativePerMonth: number;
```

---

## 6. Frontend

- `frontend/lib/api/ads.api.ts`
- Wizard steps: Offer → Creative → Budget → Review → Launch
- `AdPreviewFacebookCard.tsx` — feed mockup
- Connect banner on marketing hub

**Pixel:** Add Meta Pixel script to `(landing)/layout.tsx` when `NEXT_PUBLIC_META_PIXEL_ID` set (per creator in v2).

---

## 7. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Meta OAuth + connection UI |
| 2 | AI creative generation (no launch) |
| 3 | Campaign create (PAUSED) + manual activate in Meta for beta |
| 4 | Full launch + metrics sync |
| 5 | Conversion tracking + ROI in creator analytics |

---

## 8. Acceptance criteria

- [ ] Pro creator connects Meta ad account
- [ ] AI generates creative from course in <10s
- [ ] Campaign created in Meta with correct landing URL
- [ ] Metrics sync shows spend/impressions in Chabaqa UI
- [ ] Starter plan cannot access ads (FeatureGate)

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Meta app review rejection | Start with manual ad account linking guide |
| Ad policy violations | Pre-flight checklist; human review step |
| Spend runaway | Cap daily budget max (e.g. 500 TND) on platform |

---

## 10. Files to create/modify

**Create:** `domains/marketing/ads/*`, `schemas/marketing/ad-campaign.schema.ts`  
**Modify:** `payment-success` page (pixel event), `plan.schema.ts`, `creator/marketing/*` sidebar
