# Runtime Mock Data Remediation Prompt

Use this document as the implementation prompt for the next remediation pass. The goal is to remove remaining frontend runtime mock/static business data where real backend APIs already exist, while preserving explicit unavailable states for backend gaps and keeping legitimate client-only state.

## Objective

Replace or quarantine every remaining runtime surface that can show fake business records, fake metrics, fake IDs, or simulated backend actions when a real backend API already exists.

Do not replace UI-only placeholders, animations, auth token storage, draft restore, selected community state, cookie consent, or optimistic temporary UI IDs that are replaced by real API responses.

## Ground Rules

1. Make the smallest correct changes.
2. Do not create new fake fallback data.
3. If an endpoint exists, call it and render the response.
4. If an endpoint does not exist, show an explicit backend-required/unavailable state.
5. Do not write business records to `localStorage`.
6. Do not generate persistent fake IDs such as `session_${Date.now()}`.
7. Run build and targeted searches after each phase.

## Verification Commands

Run these from the repo root after each phase:

```bash
cd /home/louay/Documents/chabaqa
rg -n "chabaqa_events|chabaqa_mock_sessions|chabaqa_challenges|chabaqa_products|event_\$|session_\$|prd_\$|chl_\$|mockCredentials|INIT_CONVERSATIONS|INIT_BROADCASTS|INIT_AUTOMATIONS|useLocalList|LegacyBroadcastsView|LegacyAutomationsView|INIT_MEMBERS|INIT_INVITES|LegacyTeamPage" frontend/app frontend/components -S --glob '!**/__tests__/**'
rg -n "@/lib/(mock-data|data-communities|dashboard-data)|lib/(mock-data|data-communities|dashboard-data)" frontend/app frontend/components -S --glob '!**/__tests__/**'
cd frontend && npm run build
cd /home/louay/Documents/chabaqa && git diff --check
```

Expected result:

- No runtime business-record localStorage keys.
- No runtime fake persistent IDs.
- No runtime imports of `data-communities` or `dashboard-data` except type-only imports during transition.
- Build passes.

---

# Phase 1: Event Sessions Tab

## File

`frontend/app/(creator)/creator/events/[eventId]/components/EventSessionsTab.tsx`

## Current Issue

This component still performs event session add/update/remove actions only in local component state.

Problematic behavior:

- `nextId()` creates fake IDs:

```ts
const nextId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
```

- `handleAddSession()` creates a local `EventSession` object and appends it to `event.sessions` through `onUpdateEvent`.
- `handleUpdateSession()` mutates the local session list.
- Delete appears local-state based.
- Toast says “Click Save Changes to persist”, but session-specific backend APIs already exist.

## Real Backend APIs

Defined in `frontend/lib/api/events.api.ts`:

```ts
eventsApi.addSession(id, data)
eventsApi.removeSession(id, sessionId)
eventsApi.getSessions(id)
eventsApi.update(id, data)
```

Existing DTO:

```ts
export interface CreateEventSessionData {
  title: string
  description: string
  startTime: string
  endTime: string
  speaker?: string
  notes?: string
  isActive?: boolean
}
```

## Implementation Plan

1. Import the real API:

```ts
import { eventsApi } from '@/lib/api/events.api'
```

2. Remove `nextId()` completely.

3. Determine the event ID:

```ts
const eventId = event._id || event.id
```

Use whichever fields exist on the `Event` model. If TypeScript complains, inspect `frontend/lib/models` and `frontend/lib/api/types` for the canonical event ID shape.

4. Convert `handleAddSession()` into an async backend call:

```ts
const handleAddSession = async () => {
  const error = validateSession(newSession)
  if (error) {
    toast({ title: 'Validation error', description: error, variant: 'destructive' as any })
    return
  }

  if (!eventId) {
    toast({ title: 'Unable to add session', description: 'Missing event id.', variant: 'destructive' as any })
    return
  }

  try {
    const response = await eventsApi.addSession(eventId, {
      title: newSession.title.trim(),
      description: newSession.description.trim(),
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      speaker: newSession.speaker.trim() || undefined,
      notes: newSession.notes.trim() || undefined,
      isActive: newSession.isActive,
    })

    const created = response?.data?.data || response?.data || response?.session || response
    const nextSession = {
      id: created?._id || created?.id,
      title: created?.title || newSession.title.trim(),
      description: created?.description || newSession.description.trim(),
      startTime: created?.startTime || newSession.startTime,
      endTime: created?.endTime || newSession.endTime,
      speaker: created?.speaker || newSession.speaker.trim(),
      notes: created?.notes || newSession.notes.trim() || undefined,
      isActive: created?.isActive ?? newSession.isActive,
      attendance: Number(created?.attendance ?? 0),
    }

    onUpdateEvent({ sessions: [...sessions, nextSession] })
    setNewSession(createEmptySession())
    setIsAddDialogOpen(false)
    toast({ title: 'Session added', description: 'The event session was saved.' })
  } catch (err: any) {
    toast({ title: 'Failed to add session', description: err?.message || 'Try again.', variant: 'destructive' as any })
  }
}
```

5. Convert delete to call the backend:

```ts
await eventsApi.removeSession(eventId, sessionId)
onUpdateEvent({ sessions: sessions.filter(session => session.id !== sessionId) })
```

6. For update, choose one of these paths:

Preferred path if backend supports it:

- Add a client method in `events.api.ts`:

```ts
updateSession: async (id: string, sessionId: string, data: Partial<CreateEventSessionData>): Promise<ApiSuccessResponse<any>> => {
  return apiClient.patch<ApiSuccessResponse<any>>(`/events/${id}/sessions/${sessionId}`, data)
}
```

- Use it in `handleUpdateSession()`.

Fallback path if backend does not support update:

- Disable or hide the edit action.
- Show an explicit message:

```text
Editing event sessions requires a backend update-session endpoint.
```

Do not mutate local session data as if it persisted.

## Acceptance Criteria

- No `session_${Date.now()}` in this file.
- Add session calls `eventsApi.addSession`.
- Remove session calls `eventsApi.removeSession`.
- Edit is either backend-backed or explicitly unavailable.
- No fake success message for non-persisted changes.

---

# Phase 2: Booking Confirmation Meet Link Modal

## File

`frontend/components/creator-dashboard/bookings/ConfirmModal.tsx`

## Current Issue

This modal generates fake Google Meet links client-side.

Problematic behavior:

```ts
function genMeetLink() {
  const r = () => Math.random().toString(36).slice(2,5)
  return `https://meet.google.com/${r()}-${r()}${r().slice(0,1)}-${r()}`
}
```

It also simulates backend work:

```ts
await new Promise(r => setTimeout(r,1400))
setLink(genMeetLink())
```

## Real Backend APIs

Defined in `frontend/lib/api/sessions.api.ts`:

```ts
sessionsApi.createMeet(bookingId)
sessionsApi.createMeetLink(bookingId)
sessionsApi.confirmBooking(bookingId, data)
```

Existing real usage:

- `frontend/app/(creator)/creator/sessions/bookings/components/bookings-page-content.tsx`
- `frontend/app/(creator)/creator/sessions/components/pending-requests-card.tsx`
- `frontend/app/(creator)/creator/sessions/components/upcoming-sessions-card.tsx`

## Implementation Plan

1. First check if `ConfirmModal` is still used:

```bash
rg -n "ConfirmModal" frontend/app frontend/components -S --glob '!**/__tests__/**'
```

2. If unused, delete the file or leave a note in this remediation doc that it is dead code and should be removed.

3. If used, import the real API:

```ts
import { sessionsApi } from '@/lib/api/sessions.api'
```

4. Remove `genMeetLink()`.

5. Replace `generate()`:

```ts
const generate = async () => {
  setStep('loading')
  try {
    const response = await sessionsApi.createMeet(booking._id)
    const payload = response?.data || response
    const meetingUrl = payload?.meetingUrl

    if (!meetingUrl) {
      throw new Error('Meeting link was not returned by the backend.')
    }

    setLink(meetingUrl)
    setStep('success')
  } catch (err: any) {
    setStep('idle')
    // Render error state or pass to toast if available.
  }
}
```

6. Replace `confirm()` if the parent does not already confirm with the API:

```ts
const confirm = async () => {
  await sessionsApi.confirmBooking(booking._id, { meetingUrl: link })
  onConfirmed(booking._id, link)
  onClose()
}
```

7. If the parent already calls `sessionsApi.confirmBooking`, keep `onConfirmed` as the API boundary and document it in code with a concise comment.

## Acceptance Criteria

- No `genMeetLink()`.
- No fake Meet URL generation.
- No simulated delay for backend work.
- Meet link comes from `sessionsApi.createMeet` or `sessionsApi.createMeetLink`.
- Booking confirmation is backend-backed exactly once.

---

# Phase 3: Creator Dashboard Static Data Module

## Files

Primary module:

`frontend/lib/dashboard-data.ts`

Runtime consumers to inspect/update:

- `frontend/components/creator-dashboard/DashOnboarding.tsx`
- `frontend/components/creator-dashboard/DashKpiGrid.tsx`
- `frontend/components/creator-dashboard/DashRecentActivity.tsx`
- `frontend/components/creator-dashboard/DashYourContent.tsx`
- `frontend/components/creator-dashboard/DashYourCommunities.tsx`

## Current Issue

`frontend/lib/dashboard-data.ts` exports hardcoded creator business data:

```ts
kpiCards
activityItems
contentItems
communities
onboardSteps
```

Most current imports are type-only, but `DashOnboarding.tsx` imports runtime `onboardSteps` as a default:

```ts
import { onboardSteps, type OnboardStep } from '@/lib/dashboard-data'

export default function DashOnboarding({ initialSteps = onboardSteps }: { initialSteps?: OnboardStep[] })
```

Current risk:

- If a dashboard component receives no real data and falls back to these exports, the UI can show fake metrics/content.
- `DashOnboarding` can show “Create a community” and “Add your first course” as done even when not derived from backend state.

## Real Backend APIs

Available APIs and data sources:

```ts
creatorAnalyticsApi / creator-analytics.api.ts
communitiesApi.getMyManageable()
coursesApi.getCreated(...)
challengesApi.getByCreator(...)
sessionsApi.getByCreator(...)
eventsApi.getByCreator(...)
productsApi.getByCreator(...)
```

Also inspect existing dashboard hooks before adding new API calls:

```bash
rg -n "useCreator|creator.*dashboard|creatorAnalytics|DashKpiGrid|DashOnboarding" frontend/hooks frontend/components frontend/app -S
```

## Implementation Plan

1. Convert `dashboard-data.ts` into type-only or split types into a new module.

Preferred:

Create:

`frontend/lib/dashboard-types.ts`

Move only these exports:

```ts
export type TrendDir = 'up' | 'down' | 'flat'
export interface KpiCard { ... }
export interface ActivityItem { ... }
export interface ContentItem { ... }
export interface Community { ... }
export interface OnboardStep { ... }
```

2. Update type-only consumers:

```ts
import type { KpiCard, TrendDir } from '@/lib/dashboard-types'
```

3. Remove runtime exports from `dashboard-data.ts`:

```ts
kpiCards
activityItems
contentItems
communities
onboardSteps
```

Either delete the file after migration or leave it with types only temporarily.

4. Fix `DashOnboarding.tsx`.

Replace runtime fallback with derived state from props or real backend state.

Recommended minimal shape:

```ts
const DEFAULT_STEPS: OnboardStep[] = [
  { id: 'community', label: 'Create a community', done: false },
  { id: 'course', label: 'Add your first course', done: false },
  { id: 'share', label: 'Share your invite link', done: false },
]
```

But this should only be UI copy, not fake completion state.

Better backend-backed implementation:

- Use `useCreatorCommunity()` for community existence.
- Use `coursesApi.getCreated({ page: 1, limit: 1, communityId: selectedCommunityId })` for first course.
- Use a real invitation/share endpoint if one exists.
- If no share/invitation endpoint exists, keep `share.done = false` and label it as incomplete.

Example:

```ts
const steps = [
  { id: 'community', label: 'Create a community', done: Boolean(selectedCommunityId) },
  { id: 'course', label: 'Add your first course', done: createdCoursesCount > 0 },
  { id: 'share', label: 'Share your invite link', done: false },
]
```

5. Do not allow toggling checklist completion as if it persists.

Current behavior:

```ts
const toggle = (id: string) => setSteps(prev => ...)
```

Replace with either:

- non-clickable checklist display, or
- backend-backed checklist preferences if an endpoint exists.

6. Verify dashboard components receive real data via props/hooks.

If any dashboard component imports runtime arrays from `dashboard-data.ts`, replace with real API data or empty state.

## Acceptance Criteria

- `frontend/lib/dashboard-data.ts` no longer exports fake runtime business arrays.
- `DashOnboarding` does not import runtime `onboardSteps` from a mock module.
- Checklist completion state is derived from backend state or shown incomplete.
- KPI/content/community/activity components do not fall back to fake records.

---

# Phase 4: Explore Static Data Module

## File

`frontend/lib/data-communities.ts`

## Current Issue

This module mixes type exports with large static runtime datasets:

```ts
mockCredentials
mockPosts
ExploreData
communitiesData
```

It contains real-looking communities, courses, challenges, products, sessions, and events.

Runtime usage after the last remediation is mostly type usage, but keeping mixed mock data in the same module makes accidental runtime import likely.

## Real Backend APIs

Available APIs:

```ts
communitiesApi.getAll(...)
coursesApi.getAll(...)
challengesApi.getAll(...)
productsApi.getAll(...)
sessionsApi.getAll(...)
eventsApi.getAll(...)
```

The landing explore page already aggregates real API data. Keep that path as the only source for explore results.

## Runtime Consumers To Update

Current type/runtime import sites:

- `frontend/app/(landing)/(communities)/components/community-card.tsx`
- `frontend/app/(landing)/(communities)/components/featured-community-card.tsx`
- `frontend/app/(landing)/(communities)/components/communities-search-and-results-client.tsx`
- tests under `__tests__` can keep test-local mock data, but should import types from a neutral type module.

## Implementation Plan

1. Create a neutral type module:

`frontend/lib/explore-types.ts`

Move only the `Explore` type:

```ts
export type Explore = {
  id: string
  mongoId?: string
  type: 'community' | 'course' | 'challenge' | 'product' | 'oneToOne' | 'event'
  name: string
  slug: string
  creator: string
  creatorSlug?: string
  creatorAvatar: string
  description: string
  category: string
  members: number
  rating: number
  ratingCount?: number
  tags: string[]
  verified: boolean
  price: number
  priceType: 'free' | 'paid' | 'monthly' | 'yearly' | 'hourly'
  image: string
  featured: boolean
  link: string
  isMember?: boolean
  hasContentAccess?: boolean
  communityId?: string
  communityName?: string
  communitySlug?: string
}
```

2. Update imports:

```ts
import type { Explore } from '@/lib/explore-types'
```

Update at least:

- `community-card.tsx`
- `featured-community-card.tsx`
- `communities-search-and-results-client.tsx`
- related tests

3. Delete or quarantine runtime mock exports from `data-communities.ts`:

```ts
mockCredentials
mockPosts
ExploreData
communitiesData
```

4. If other code imports `communitiesData.categories` or `communitiesData.sortOptions`, replace with:

```ts
const categories = ['All', ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))]
```

Sort options are acceptable UI constants:

```ts
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
]
```

5. Keep explore result data coming from the API aggregation only.

Do not add a fallback to `ExploreData` if APIs fail. Use empty/error states.

## Acceptance Criteria

- No runtime import of `@/lib/data-communities` in `frontend/app` or `frontend/components` except tests during transition.
- `mockCredentials` is deleted or no longer exported from runtime modules.
- `ExploreData` and `communitiesData` are deleted or moved to test fixtures only.
- Explore UI continues to render using API-provided props.

---

# Phase 5: Temporary Landing Folder

## Path

`frontend/chabaqa-landing-temp/**`

## Current Issue

Temp landing files still import `communitiesData` and static explore data:

- `frontend/chabaqa-landing-temp/components/communities/communities-search-and-results-client.tsx`
- `frontend/chabaqa-landing-temp/app/communities/page.tsx`
- `frontend/chabaqa-landing-temp/components/communities-search.tsx`

## Real Backend APIs

Same as Phase 4:

```ts
communitiesApi.getAll(...)
coursesApi.getAll(...)
challengesApi.getAll(...)
productsApi.getAll(...)
sessionsApi.getAll(...)
eventsApi.getAll(...)
```

## Implementation Decision

Choose one path.

### Option A: Folder Is Not Shipped

If this is old/temp code not imported by the actual app:

1. Delete `frontend/chabaqa-landing-temp/**`, or
2. Move it outside `frontend`, or
3. Exclude it explicitly from lint/build/audit.

Preferred: delete it if confirmed unused.

Verification:

```bash
rg -n "chabaqa-landing-temp" frontend -S
```

### Option B: Folder Is Shipped

If the folder is used:

1. Replace `communitiesData` imports.
2. Use the same API aggregation pattern as the main explore page.
3. Derive categories from fetched result data.
4. Use sort options as local UI constants only.
5. Render empty/error states when APIs fail.

## Acceptance Criteria

- No shipped runtime code imports static `communitiesData` from temp folder.
- Temp code is either deleted/quarantined or backend-backed.

---

# Backend Gap Items

Do not fake these. Keep explicit unavailable states unless backend endpoints are added.

## Team Invite By Email

File:

`frontend/app/(creator)/creator/team/page.tsx`

Current correct state:

- Uses `communityAccessApi.listStaff`.
- Uses `communityAccessApi.updateStaffRole`.
- Uses `communityAccessApi.removeStaff`.
- Empty state says invite/assignment requires backend user search.

Gap:

- Assigning staff by email requires a backend user search endpoint or a staff invitation endpoint.

Do not reintroduce local invites.

## Creator DM Broadcasts And Automations

File:

`frontend/app/(creator)/creator/messages/page.tsx`

Current correct state:

- Conversations use `dmApi`.
- Broadcasts and automations render unavailable states.

Gap:

- No DM broadcast endpoint.
- No DM automation workflow endpoint.

Recommended UX:

- Link users to Email Marketing and WhatsApp campaigns for real broadcast workflows.
- Do not simulate DM broadcasts.

## Admin And Community Dashboard Aggregates

Several pages explicitly avoid fake data and show backend-required placeholders.

Examples:

- Admin/community support metrics.
- Admin/community finance transaction rows.
- Marketing segmentation aggregates.
- Affiliate payout administration outside platform admin payout APIs.

Keep these unavailable until backend endpoints exist.

---

# Acceptable Static Or Client-Only Uses

Do not “fix” these unless they are being misused as business data.

## Allowed localStorage

- Auth tokens and user cache in `frontend/app/providers/auth-provider.tsx`.
- `creator_selected_community_id` in creator community context/sidebar.
- Draft restore for create flows.
- Cookie consent and analytics script gates.
- Video playback/progress storage.
- Theme/locale/client preferences.

## Allowed Placeholder Media

- `/placeholder.svg` image fallbacks.
- Avatar/image fallback helpers.

## Allowed Timers And Randomness

- Animation timers.
- Confetti randomness.
- Copy-to-clipboard reset timers.
- UI-only debounce/highlight timers.

## Allowed Optimistic IDs

Example:

`frontend/app/(creator)/creator/messages/page.tsx`

```ts
pending-${Date.now()}
```

This is acceptable because it is a temporary optimistic UI ID replaced after `dmApi.sendMessage` returns.

## Allowed Derived Chart Arrays

These arrays are not mock data when they are derived from backend values:

- `ChallengeAnalyticsTab.tsx`:
  - `progressDistributionData`
  - `statusData`
- `admin/communities/[id]/page.tsx`:
  - `performanceData`
  - `memberStatusData`

## Allowed Review Refresh Delays

These use real `feedbackApi` and only wait before refetching:

- `frontend/components/reviews/reviews-section.tsx`
- `frontend/components/reviews/course-reviews-section.tsx`

The delay can be removed later for UX/performance, but it is not mock data.

---

# Final Validation Checklist

After completing all phases:

1. Run forbidden key search:

```bash
rg -n "chabaqa_events|chabaqa_mock_sessions|chabaqa_challenges|chabaqa_products|event_\$|session_\$|prd_\$|chl_\$|mockCredentials|INIT_CONVERSATIONS|INIT_BROADCASTS|INIT_AUTOMATIONS|useLocalList|LegacyBroadcastsView|LegacyAutomationsView|INIT_MEMBERS|INIT_INVITES|LegacyTeamPage" frontend/app frontend/components -S --glob '!**/__tests__/**'
```

2. Run static module import search:

```bash
rg -n "@/lib/(mock-data|data-communities|dashboard-data)|lib/(mock-data|data-communities|dashboard-data)" frontend/app frontend/components -S --glob '!**/__tests__/**'
```

3. Run build:

```bash
cd frontend && npm run build
```

4. Run whitespace check:

```bash
cd /home/louay/Documents/chabaqa && git diff --check
```

5. Manual smoke tests:

- Create an event session and confirm it persists after refresh.
- Remove an event session and confirm it is removed after refresh.
- Confirm a session booking/Meet link from any UI that still uses `ConfirmModal` or delete the modal if unused.
- Open creator dashboard and confirm no fake KPI/content/community fallback appears while real data is loading or empty.
- Open explore page and confirm results still come from backend aggregation.
- Confirm backend-gap pages show unavailable states, not fake rows or counts.
