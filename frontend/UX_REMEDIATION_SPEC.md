# Creator Dashboard — UX Remediation Spec

## Overview

This document summarizes the comprehensive UX remediation applied to the Chabaqa creator dashboard. The changes establish a standardized design system, consistent navigation, unified state handling, and a predictable page structure across all 21+ creator pages.

---

## 1. Shared Design System Components

### `components/creator-dashboard/`

| File | Purpose |
|------|---------|
| `page-state.tsx` | Unified state rendering for all page states: loading, refreshing, empty, no-results, error, no-permission, no-community, unavailable, coming-soon. Includes `ModuleEmptyState` pre-composed for 15 modules. |
| `page-framework.tsx` | Standardized layout primitives: `PageHeader` (title + breadcrumbs + actions), `StatsGrid`, `ActionBar` (search + tabs + filters), `PageShell` (consistent padding wrapper), `ContentGrid`, `Section`. |
| `shared-dialogs.tsx` | `ConfirmDialog` (destructive/default variants) and `TOAST_MESSAGES` dictionary (created, updated, deleted, published, error, permissionDenied, noCommunity). |
| `terminology.ts` | `CREATOR_TERMS` — single-source-of-truth naming dictionary for modules, statuses, actions, monetization terms, and replacement mappings. |
| `index.ts` | Barrel export for all shared components. |

### `hooks/use-community-guard.ts`

Wraps `useCreatorCommunity()` and returns a `guard` element for loading/error/no-community states. Pages do:
```tsx
const { guard, selectedCommunityId, ... } = useCommunityGuard()
if (guard) return guard
// ... normal rendering
```

---

## 2. Sidebar Navigation Redesign

**File:** `app/(creator)/creator/components/dashboard-sidebar.tsx`

### New Information Architecture

| Group | Items |
|-------|-------|
| **Top** | Overview, Communities, Analytics |
| **Content** (expandable) | Courses, Challenges, Sessions, Events, Products, Posts |
| **Monetization** (expandable) | Subscriptions, Payouts, Manual Payments |
| **Marketing** (expandable) | Email Campaigns, Affiliates, Contacts, Messages (soon), WhatsApp (soon) |
| **Configure** | Team & Roles, Customize, Integrations |
| **System** | Notifications, Help & Support |

### Key Improvements
- Semantic separator lines between groups
- "Soon" items show tooltip badge and are non-clickable
- External links get `ExternalLink` icon indicator
- RBAC filtering via `canPermission()` using `CommunityPermission` enum
- Community prefetch on community switch

---

## 3. Page Refactoring Summary

All 21 creator pages now follow a standardized pattern:

### Community-Aware Pages (15 pages)
Use `useCommunityGuard()` → `if (guard) return guard` → `<PageShell>` wrapper:

- `dashboard/page.tsx` — Main overview with stats, tabs, activity feed
- `courses/page.tsx` — Course listing with grid layout
- `challenges/page.tsx` — Challenge listing + performance overview
- `sessions/page.tsx` — Session listing (delegates to ClientSessionsView)
- `events/page.tsx` — Event listing with filters
- `products/page.tsx` — Product catalog
- `posts/page.tsx` — Post management with create/edit dialog
- `team/page.tsx` — Staff management with role permissions
- `analytics/page.tsx` — Full analytics dashboard (2500+ lines)
- `customize/page.tsx` — Community customization settings
- `marketing/emails/page.tsx` — Email campaigns
- `marketing/affiliates/page.tsx` — Affiliate program management
- `marketing/messages/page.tsx` — SMS (coming soon)
- `marketing/whatsapp/page.tsx` — WhatsApp (coming soon)
- `monetization/payouts/page.tsx` — Payout management

### Non-Community Pages (6 pages)
Use `<PageShell>` wrapper only:

- `communities/page.tsx` — Community listing/creation
- `notifications/page.tsx` — Notification center
- `help/page.tsx` — Help & support center
- `integrations/page.tsx` — Integration marketplace
- `monetization/subscriptions/page.tsx` — Subscription plans
- `monetization/manual-payments/page.tsx` — Manual payment verification

### Redirect Pages (1 page)
- `marketing/contacts/page.tsx` — Redirects to `/creator/marketing/emails`

---

## 4. State Handling Matrix

| State | Before | After |
|-------|--------|-------|
| Loading | Inconsistent: some used Skeleton, some Spinner, some nothing | `<PageState variant="loading" />` everywhere |
| No community | Ad-hoc Alert/toast or crash | `useCommunityGuard()` returns unified "select a community" UI |
| Empty data | Custom per-page empty divs | `<ModuleEmptyState module="courses" />` with consistent CTA |
| Error | `console.error` only or variant toast | `<PageState variant="error" />` + `TOAST_MESSAGES.error()` |
| Coming soon | Custom Card + Badge per page | `<PageState variant="coming-soon" />` |
| No permission | Not handled | `<PageState variant="no-permission" />` (via guard) |

---

## 5. Terminology Standardization

The `CREATOR_TERMS` dictionary standardizes all UI labels:

| Old (inconsistent) | New (standardized) |
|--------------------|--------------------|
| My Courses / Courses List | Courses |
| Coaching Sessions / 1-on-1 | Sessions |
| Membership / Plan | Subscriptions |
| Sales / Earnings / Income | Revenue |
| Members / Community Members | Members |
| Staff / Admins / Team | Team & Roles |

---

## 6. Files Created

```
components/creator-dashboard/
├── index.ts                  (barrel export)
├── page-framework.tsx        (PageHeader, StatsGrid, ActionBar, PageShell, etc.)
├── page-state.tsx            (PageState, ModuleEmptyState)
├── shared-dialogs.tsx        (ConfirmDialog, TOAST_MESSAGES)
└── terminology.ts            (CREATOR_TERMS)

hooks/
└── use-community-guard.ts    (useCommunityGuard hook)
```

## 7. Files Modified

```
app/(creator)/creator/components/dashboard-sidebar.tsx  (complete rewrite)
app/(creator)/creator/dashboard/page.tsx                (guard + PageShell)
app/(creator)/creator/challenges/page.tsx               (full refactor)
app/(creator)/creator/courses/page.tsx                  (guard + PageShell)
app/(creator)/creator/sessions/page.tsx                 (guard + TOAST_MESSAGES)
app/(creator)/creator/events/page.tsx                   (guard + PageShell)
app/(creator)/creator/products/page.tsx                 (guard + PageShell)
app/(creator)/creator/posts/page.tsx                    (guard + PageShell)
app/(creator)/creator/team/page.tsx                     (guard + PageShell)
app/(creator)/creator/analytics/page.tsx                (guard + PageShell)
app/(creator)/creator/customize/page.tsx                (guard + PageShell)
app/(creator)/creator/notifications/page.tsx            (PageShell wrapper)
app/(creator)/creator/communities/page.tsx              (PageShell wrapper)
app/(creator)/creator/help/page.tsx                     (PageShell wrapper)
app/(creator)/creator/integrations/page.tsx             (PageShell wrapper)
app/(creator)/creator/marketing/emails/page.tsx         (guard + PageShell)
app/(creator)/creator/marketing/affiliates/page.tsx     (guard + PageShell)
app/(creator)/creator/marketing/messages/page.tsx       (coming-soon pattern)
app/(creator)/creator/marketing/whatsapp/page.tsx       (coming-soon pattern)
app/(creator)/creator/monetization/subscriptions/page.tsx (PageShell wrapper)
app/(creator)/creator/monetization/payouts/page.tsx     (guard + PageShell)
app/(creator)/creator/monetization/manual-payments/page.tsx (PageShell wrapper)
```
