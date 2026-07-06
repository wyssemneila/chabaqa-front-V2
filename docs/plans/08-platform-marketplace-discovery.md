# Plan 08: Platform Marketplace / Discovery (Chabaqa Discover)

**Status:** Draft  
**Priority:** P0 (Wave 1)  
**Competitive parity:** Circle Discover, Skool Discover, Whop Discover  
**Current:** `frontend/app/(landing)/explore/page.tsx` fans out to 6 APIs

---

## 1. Objectives

1. Unified **discovery API** with search, filters, ranking, pagination.
2. **Featured** and **trending** surfaces on homepage + `/explore`.
3. Creator **apply for featuring** (admin approval).
4. SEO-optimized public listings (SSR).
5. Optional **categories** and **tags** consistent across content types.

---

## 2. Current state

| Item | State |
|------|--------|
| `/explore` page | ✅ SSR, 6 parallel fetches |
| `GET /communities` | ✅ search, category, featured, pagination |
| Unified explore endpoint | ❌ |
| Global search across courses/products | ❌ |
| Ranking algorithm | ⚠️ `rank` on community schema |
| Admin featuring | ⚠️ Partial in admin community-management |

---

## 3. Target UX

### 3.1 Public surfaces

| Surface | Content |
|---------|---------|
| Homepage section | Trending communities + new courses |
| `/explore` | Tabbed: All / Communities / Courses / Challenges / Events / Products |
| `/explore?q=fitness&category=health` | Search results |
| `/creators/[slug]` | Public creator profile (optional v2) |

### 3.2 Design: **“Market hall”**

- Editorial layout: large feature card + grid (not uniform card grid only).
- Category pills with tactile press state.
- Search bar prominent with recent searches (localStorage).
- **Featured** ribbon on cards (gold accent, not purple gradient).

### 3.3 Creator

- Dashboard card: “Get discovered” → submit for featuring
- Tips for SEO (title, description, cover image)

---

## 4. Data models

### Extend `Community`

```typescript
discovery: {
  featured: boolean
  featuredAt?: Date
  featuredUntil?: Date
  discoverable: boolean          // opt-out
  searchKeywords?: string[]
  qualityScore?: number          // admin/computed
}
```

### `DiscoveryImpression` (analytics, v2)

```typescript
contentType, contentId, userId?, sessionId, createdAt
```

### `FeatureRequest`

```typescript
creatorId, communityId, status: 'pending'|'approved'|'rejected', note
```

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/discovery/
  discovery.controller.ts
  discovery.service.ts
  discovery-ranking.service.ts
  discovery-index.service.ts       # optional Elasticsearch later
```

### 5.2 Unified API

**`GET /discovery`**

Query params:
```
q          string   full-text
type       community|course|challenge|event|product|session|all
category   string
tags       string[]
sort       trending|newest|popular|price_asc|price_desc
priceMin, priceMax
page, limit
locale     ar|fr|en
```

**Response:**

```typescript
{
  items: DiscoveryItem[]
  facets: { categories: {name, count}[], types: {...} }
  pagination: { page, limit, total }
}

type DiscoveryItem = {
  type: string
  id: string
  title: string
  slug: string
  thumbnailUrl?: string
  creatorName: string
  communitySlug: string
  price?: { amount, currency, priceType }
  memberCount?: number
  rating?: number
  featured: boolean
  url: string                 // canonical frontend path
}
```

### 5.3 Ranking algorithm (v1)

```
score = 
  0.4 * normalize(memberCount) +
  0.3 * normalize(recentJoins30d) +
  0.2 * normalize(revenue30d) +
  0.1 * adminQualityScore
```

Boost `featured` items to top slot.

**Trending:** velocity of joins + engagement in last 7d vs prior 7d.

### 5.4 Implementation strategy

**Phase 1:** MongoDB aggregation pipeline joining communities + published content counts.

**Phase 2:** Nightly materialized `DiscoveryCatalog` collection denormalized for fast reads.

```typescript
// discovery-catalog.schema.ts
type, contentId, communityId, title, slug, searchText, facets, rankScores, updatedAt
```

Text index on `searchText`.

### 5.5 Admin APIs

| Method | Path |
|--------|------|
| GET | `/admin/discovery/feature-requests` |
| PATCH | `/admin/discovery/communities/:id/feature` |
| POST | `/admin/discovery/reindex` |

### 5.6 Creator API

| Method | Path |
|--------|------|
| POST | `/discovery/feature-requests` |
| PATCH | `/communities/:id/discovery` | discoverable, keywords |

---

## 6. Frontend

### 6.1 Refactor explore

`explore/page.tsx`:
- Single `discoveryApi.search()` call instead of 6 fetches
- Pass facets to filter UI

`frontend/lib/api/discovery.api.ts`

### 6.2 Components

- `DiscoveryHero.tsx` — featured carousel
- `DiscoveryFilters.tsx`
- `DiscoveryCard.tsx` — unified card by type
- Reuse `explore-card-routing.ts` for URLs

### 6.3 SEO

- `generateMetadata` per explore query
- JSON-LD `ItemList` on explore page
- Canonical URLs per item type

### 6.4 Homepage

Wire landing hero to `GET /discovery?sort=trending&limit=6`

---

## 7. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | `GET /discovery` communities + courses only |
| 2 | All content types + explore refactor |
| 3 | Trending algorithm + featured slots |
| 4 | Feature requests + admin approval |
| 5 | Materialized catalog + full-text search |

---

## 8. Acceptance criteria

- [ ] `/explore` loads with 1 API call <500ms p95 (cached)
- [ ] Search "yoga" returns relevant communities and courses
- [ ] Featured communities appear first when flagged
- [ ] Non-discoverable communities hidden from public index
- [ ] SSR renders meta tags for explore

---

## 9. Caching

- Redis cache key `discovery:{hash(params)}` TTL 60s
- Invalidate on community publish/update

---

## 10. Files

**Create:** `domains/discovery/*`, schemas  
**Modify:** `explore/page.tsx`, `explore-data.ts`, `communities.controller.ts`, admin community-management, landing homepage
