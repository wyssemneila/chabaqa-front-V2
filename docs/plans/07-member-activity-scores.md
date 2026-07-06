# Plan 07: Member Activity Scores (Circle-style)

**Status:** Draft  
**Priority:** P0 (Wave 1)  
**Competitive parity:** Circle AI Activity Scores  
**Foundation:** `content-tracking.schema.ts`, `content-tracking.service.ts`, `analytics.service.ts`

---

## 1. Objectives

1. Compute per-member **activity scores** per community (0–100).
2. Display in **member directory**, member profile (staff view), and creator analytics.
3. Enable **segments** for campaigns (inactive, at-risk, champions).
4. Foundation for AI workflows (Plan 01) and WhatsApp segments (Plan 02).

---

## 2. Current state

| Signal | Source |
|--------|--------|
| Views, completes, watch time | `ContentProgress`, `TrackingAction` |
| Posts, comments | `post.schema.ts`, tracking |
| Purchases | `order.schema.ts` |
| Achievements XP | `achievement.schema.ts` |
| `interactionScore` | `community-management.service.ts` (admin only) |
| Unified member score API | ❌ |

---

## 3. Score model (v1)

### 3.1 Component scores (0–100 each)

| Component | Weight | Inputs (30-day window) |
|-----------|--------|------------------------|
| **Learning** | 30% | Course/challenge progress %, completions |
| **Engagement** | 25% | Posts, comments, reactions given/received |
| **Attendance** | 15% | Event check-ins, session attendance |
| **Commerce** | 15% | Purchases, active subscription |
| **Consistency** | 15% | Login days, streak from achievements |

### 3.2 Composite

```
activityScore = round(
  0.30 * learning +
  0.25 * engagement +
  0.15 * attendance +
  0.15 * commerce +
  0.15 * consistency
)
```

### 3.3 Derived labels

| Score | Label |
|-------|-------|
| 80–100 | Champion |
| 50–79 | Active |
| 20–49 | Passive |
| 0–19 | At risk |

### 3.4 Optional scores (v2)

- `churnRiskScore` (inverse of activity trend)
- `purchaseIntentScore` (checkout views without purchase)

---

## 4. Data models

### `MemberActivityScore` (daily snapshot)

```typescript
communityId: ObjectId
userId: ObjectId
date: string                    // YYYY-MM-DD
activityScore: number
components: {
  learning: number
  engagement: number
  attendance: number
  commerce: number
  consistency: number
}
label: 'champion' | 'active' | 'passive' | 'at_risk'
trend7d: number                 // delta vs prior week
computedAt: Date
```

**Index:** `{ communityId: 1, userId: 1, date: -1 }`

### `MemberActivityScoreCurrent` (materialized latest)

```typescript
communityId: ObjectId
userId: ObjectId
activityScore: number
label: string
lastActiveAt: Date
updatedAt: Date
```

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/analytics/member-scores/
  member-score.controller.ts
  member-score.service.ts
  member-score-calculator.service.ts
  member-score.cron.ts              # daily 02:00 UTC
```

### 5.2 Calculator service

```typescript
async computeForMember(communityId, userId, windowDays = 30) {
  const actions = await trackingService.aggregate(communityId, userId, windowDays);
  // Map to component scores using configurable weights from community settings (v2)
  return { activityScore, components, label };
}
```

**Batch job:** For each community with >0 members, process in chunks of 500.

### 5.3 APIs

| Method | Path | Auth |
|--------|------|------|
| GET | `/communities/:id/members/scores` | Staff | Paginated directory with scores |
| GET | `/communities/:id/members/:userId/score` | Staff or self (limited) |
| GET | `/communities/:id/members/segments/:label` | Staff | IDs for campaigns |
| POST | `/communities/:id/members/scores/recalculate` | Admin | Manual refresh |

**Query params:** `sort=activityScore`, `label=at_risk`, `minScore`, `maxScore`

### 5.4 Privacy

- Members see **own** score only if `community.settings.showMemberScores` (default false)
- Staff see all

---

## 6. Frontend

### 6.1 Design: **“Signal dashboard”**

- Directory table: score as **radial mini-ring** (not plain number).
- Color: green → amber → red by label; colorblind-safe icons alongside.
- Hover: breakdown tooltip (5 components).

### 6.2 Surfaces

| Surface | Change |
|---------|--------|
| `/[creator]/[feature]/members` | Add score column + sort |
| Community admin `dashboard/admin/members` | Score + segment filters |
| Creator analytics | Widget “At-risk members (12)” |
| Plan 02 WhatsApp | Segment picker includes score labels |

### 6.3 Components

- `MemberScoreBadge.tsx`
- `MemberScoreBreakdown.tsx`
- `SegmentExportButton.tsx` → CSV for campaigns

### 6.4 API

`frontend/lib/api/member-scores.api.ts`

---

## 7. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Calculator + cron + `MemberActivityScoreCurrent` |
| 2 | Staff directory column + sort |
| 3 | Segments API + analytics widget |
| 4 | Community setting to show score to members |
| 5 | Churn risk v2 + AI weekly brief integration |

---

## 8. Acceptance criteria

- [ ] Scores recalculate nightly for all communities
- [ ] Staff sorts members by activityScore desc
- [ ] `at_risk` segment returns users inactive >14d with score <20
- [ ] Recalculate endpoint completes <5min for 10k members (batched)
- [ ] No score leakage across communities

---

## 9. Configuration (community settings)

```typescript
// community.schema.ts CommunitySettings
activityScoreWeights?: Partial<ComponentWeights>
showMemberScores?: boolean
```

---

## 10. Files

**Create:** `domains/analytics/member-scores/*`, schemas  
**Modify:** members page, admin members, `content-tracking.service.ts` (aggregate helpers), analytics page
