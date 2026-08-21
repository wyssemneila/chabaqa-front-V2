# Mock Data Remediation Plan

This plan lists the remaining platform mock/static runtime surfaces that should be fixed, the real backend APIs to use, and the exact implementation path for each item.

## Status Legend

- **Fix now**: Real frontend/backend APIs already exist.
- **Backend gap**: Do not show fake data. Keep an unavailable state until the endpoint exists.
- **Acceptable static**: Marketing copy, UI constants, placeholder images, or client-only preference storage.

## Verification Commands

Run these after each batch:

```bash
cd /home/louay/Documents/chabaqa
rg -n "mock|Mock|MOCK_|fake|Simulate|setTimeout|localStorage\\.(getItem|setItem)|4242|mock_" frontend/app frontend/components -S --glob '!**/__tests__/**'
cd frontend && npm run build
cd /home/louay/Documents/chabaqa && git diff --check
```

Use the grep output carefully: auth tokens, cookie consent, draft restore, selected community, and video playback progress are valid `localStorage` use cases.

## Phase 3A: Legacy Creator Create Forms

### 1. Event Creation Form

**File:** `frontend/components/events/create-event-form.tsx`

**Current problem:**

- `submit()` simulates progress with delays.
- Writes created event to `localStorage("chabaqa_events")`.
- Generates `event_${Date.now()}`.
- Redirects as if backend creation succeeded.

**Real APIs:**

- `eventsApi.create(data)`
- `eventsApi.addSession(id, data)`
- `eventsApi.getTickets(id)`
- Ticket/session/speaker APIs in `frontend/lib/api/events.api.ts`

**How to fix:**

1. Import `eventsApi`:

```ts
import { eventsApi } from "@/lib/api/events.api"
```

2. Replace the fake `submit()` body with:

```ts
setSubmitStatus("Creating event...")
const created = await eventsApi.create({
  communityId: selectedCommunityId, // get from creator community context
  title: data.title,
  description: data.description,
  category: data.category,
  type: data.format === "online" ? "Online" : data.format === "hybrid" ? "Hybrid" : "In-person",
  location: data.format === "online" ? undefined : [data.venueName, data.address, data.city, data.country].filter(Boolean).join(", "),
  onlineUrl: data.meetLink || undefined,
  startDate: data.startDate,
  endDate: data.endDate || data.startDate,
  startTime: data.startTime,
  endTime: data.endTime,
  timezone: data.timezone,
  image: data.banner || undefined,
  isPublished: data.isPublished,
  tickets: data.tickets.map(ticket => ({
    name: ticket.name,
    type: ticket.name,
    price: Number(ticket.price || 0),
    quantity: ticket.quantity === "unlimited" ? undefined : Number(ticket.quantity || 0),
    description: ticket.description || undefined,
  })),
})
```

3. Normalize id:

```ts
const event = created?.data?.data || created?.data || created?.event || created
const eventId = event?._id || event?.id
```

4. If the backend does not accept embedded tickets/sessions, create them after `eventId` exists.
5. Remove all `localStorage("chabaqa_events")`, `event_${Date.now()}`, and fake delays.
6. Redirect to `/creator/events` only after successful API response.

**Verification:**

```bash
rg -n "chabaqa_events|event_\\$|setTimeout|new Promise" frontend/components/events/create-event-form.tsx
```

Expected: no fake submit/cache hits.

### 2. Session Creation Form

**File:** `frontend/components/sessions/create-session-form.tsx`

**Current problem:**

- Simulates creation and availability save.
- Writes to `localStorage("chabaqa_mock_sessions")`.
- Generates `session_${Date.now()}`.

**Real APIs:**

- `sessionsApi.create(data)`
- `sessionsApi.getByCreator(...)`
- Booking/payment APIs in `frontend/lib/api/sessions.api.ts`

**How to fix:**

1. Import:

```ts
import { sessionsApi } from "@/lib/api/sessions.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
```

2. Get selected community:

```ts
const { selectedCommunityId } = useCreatorCommunity()
```

3. Replace fake `submit()` with `sessionsApi.create`:

```ts
setSubmitStatus("Creating session...")
await sessionsApi.create({
  communityId: selectedCommunityId,
  title: data.title,
  description: data.description,
  requirements: data.requirements || undefined,
  image: data.banner || undefined,
  duration: Number(data.duration),
  price: data.priceType === "paid" ? Number(data.price) : 0,
  priceType: data.priceType,
  isActive: data.isPublished,
  availability: data.availability.map(day => ({
    day: day.day,
    slots: day.slots,
  })),
} as any)
```

4. If the backend create DTO does not accept `availability`, create the session first and add a backend availability endpoint. Until that endpoint exists, show a warning that availability will not be persisted instead of writing fake local data.
5. Remove all `chabaqa_mock_sessions` localStorage writes.

### 3. Challenge Creation Form

**File:** `frontend/components/challenges/create-challenge-form.tsx`

**Current problem:**

- Simulates creation.
- Writes to `localStorage("chabaqa_challenges")`.

**Real APIs:**

- `challengesApi.create(data)`
- `challengesApi.updateTasks(id, tasks)`
- `challengesApi.publish(id)`
- `challengesApi.getByCreator(...)`

**How to fix:**

1. Import:

```ts
import { challengesApi } from "@/lib/api/challenges.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
```

2. Create challenge:

```ts
const created = await challengesApi.create({
  communityId: selectedCommunityId,
  title: data.title,
  description: data.description,
  category: data.category,
  startDate: data.startDate,
  endDate: data.endDate,
  price: data.priceType === "paid" ? Number(data.price) : 0,
  isPublished: false,
  image: data.banner || undefined,
} as any)
```

3. Normalize id:

```ts
const challenge = created?.data?.data || created?.data || created?.challenge || created
const challengeId = challenge?._id || challenge?.id
```

4. Save tasks:

```ts
await challengesApi.updateTasks(challengeId, data.steps.map((step, index) => ({
  title: step.title,
  description: step.description,
  order: index,
  resources: step.resources,
})))
```

5. Publish only if selected:

```ts
if (data.isPublished) await challengesApi.publish(challengeId)
```

6. Remove `localStorage("chabaqa_challenges")`.

### 4. Product Creation Form

**File:** `frontend/components/products/create-product-form.tsx`

**Current problem:**

- Simulates upload/save/publish.
- Writes to `localStorage("chabaqa_products")`.

**Real APIs:**

- `productsApi.create(data)`
- `productsApi.uploadFile(id, file)`
- `productsApi.createVariant(id, data)`
- `productsApi.getByCreator(...)`

**How to fix:**

1. Import:

```ts
import { productsApi } from "@/lib/api/products.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
```

2. Create product:

```ts
const created = await productsApi.create({
  communityId: selectedCommunityId,
  name: data.title,
  title: data.title,
  description: data.description,
  price: Number(data.price || 0),
  currency: data.currency || "TND",
  category: data.category,
  isPublished: data.isPublished,
  thumbnail: data.thumbnail || undefined,
} as any)
```

3. Normalize product id:

```ts
const product = created?.data?.data || created?.data || created?.product || created
const productId = product?._id || product?.id
```

4. Upload files:

```ts
for (const fileItem of data.files) {
  if (fileItem.file) await productsApi.uploadFile(productId, fileItem.file)
}
```

5. Create variants if the form supports variants.
6. Remove `localStorage("chabaqa_products")`.

## Phase 3B: Creator Messaging, Email, Affiliates

### 5. Creator Messages Page Legacy Local Lists

**File:** `frontend/app/(creator)/creator/messages/page.tsx`

**Current problem:**

- The real conversations area uses `dmApi`.
- The same file still contains `INIT_CONVERSATIONS`, `INIT_BROADCASTS`, `INIT_AUTOMATIONS`, `useLocalList`, localStorage-backed broadcasts/automations, and simulated send.

**Real APIs:**

- `dmApi.listInbox`
- `dmApi.listMessages`
- `dmApi.sendMessage`
- `emailCampaignsApi` for broadcast-style email campaigns
- `whatsappApi` for WhatsApp broadcast campaigns

**How to fix:**

1. Keep only the `dmApi` conversations implementation.
2. Delete or stop rendering:
   - `INIT_CONVERSATIONS`
   - `INIT_BROADCASTS`
   - `INIT_AUTOMATIONS`
   - `useLocalList`
   - `LegacyBroadcastsView`
   - `LegacyAutomationsView`
3. For tabs:
   - Broadcasts tab should link to `/creator/marketing/emails` and `/creator/marketing/whatsapp`.
   - Automations tab should link to email/WhatsApp automation pages.
4. Do not simulate DM broadcasts unless a backend DM broadcast endpoint is created.

### 6. Creator Email Automation Drawer

**File:** `frontend/app/(creator)/creator/email/page.tsx`

**Current problem:**

- `CreateAutomationDrawer.submit()` waits 600ms and creates a local automation with random id.

**Real APIs:**

- `emailCampaignsApi.createWelcomeTemplate`
- `emailCampaignsApi.createInactivityAutomation`
- `emailCampaignsApi.getWelcomeTemplate`
- `emailCampaignsApi.getInactivityAutomations`

**How to fix:**

1. Pass `selectedCommunityId` into the drawer.
2. For welcome automation:

```ts
await emailCampaignsApi.createWelcomeTemplate(selectedCommunityId, {
  title: name,
  subject,
  content: body,
  active: true,
} as any)
```

3. For inactivity automation:

```ts
await emailCampaignsApi.createInactivityAutomation({
  communityId: selectedCommunityId,
  title: name,
  subject,
  content: body,
  inactivityPeriod: trigger,
  delayDays: delay,
  active: true,
} as any)
```

4. Reload backend templates/automations after save.
5. Remove random id/local automation creation.

### 7. Creator Affiliates Invite Drawer

**File:** `frontend/app/(creator)/creator/affiliates/page.tsx`

**Current problem:**

- `CreateDrawer.submit()` waits 600ms and creates local affiliate stats.

**Real APIs:**

- `affiliateApi.creator.listPrograms`
- `affiliateApi.creator.invitePartner`
- `affiliateApi.creator.listPartners`
- `affiliateApi.creator.getMarketing`

**How to fix:**

1. Load creator programs scoped to selected community.
2. Choose default program or require selection.
3. Replace submit:

```ts
await affiliateApi.creator.invitePartner({
  programId,
  email,
  displayName: name,
  customCommissionPercent: comType === "percent" ? Number(comVal) : undefined,
  couponCode: slug || undefined,
})
```

4. Refresh partners/marketing from backend.
5. Remove generated local affiliate object.

## Phase 3C: Auth and Explore Static Data

### 8. Legacy Login Form

**File:** `frontend/components/login-form.tsx`

**Current problem:**

- Imports `mockCredentials`.
- Simulates auth with a delay.

**Real APIs:**

- `authApi.login`
- `useAuthContext().login`

**How to fix:**

1. Remove:

```ts
import { mockCredentials } from "@/lib/data-communities"
```

2. Use auth provider:

```ts
const { login } = useAuthContext()
await login(email, password)
onLogin(true)
```

3. On catch, set error from API.
4. Remove fake placeholder credentials from UI if they imply test credentials.

### 9. Explore/Communities Static Filters

**Files:**

- `frontend/components/communities-search.tsx`
- `frontend/app/(landing)/(communities)/components/communities-search-and-results-client.tsx`

**Current problem:**

- Import `communitiesData` from `frontend/lib/data-communities.ts`.
- Uses static categories/sort metadata in runtime components.

**Real APIs:**

- `communitiesApi.getAll`
- Explore page already uses:
  - `communitiesApi.getAll`
  - `coursesApi.getAll`
  - `challengesApi.getAll`
  - `productsApi.getAll`
  - `sessionsApi.getAll`
  - `eventsApi.getAll`

**How to fix:**

1. Remove `communitiesData` import.
2. Derive categories from incoming result data:

```ts
const categories = ["All", ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))]
```

3. Keep sort options as local UI constants:

```ts
const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
]
```

4. If a server-side taxonomy is desired, add `GET /explore/taxonomy` later.

## Phase 3D: Team Legacy Block

### 10. Creator Team Page Legacy Local Block

**File:** `frontend/app/(creator)/creator/team/page.tsx`

**Current problem:**

- The top/current implementation already uses `communityAccessApi`.
- Lower in the file there is still legacy `INIT_MEMBERS`, `INIT_INVITES`, `useLocalList`, and fake invitation modal logic.

**Real APIs:**

- `communityAccessApi.listStaff`
- `communityAccessApi.assignStaffRole`
- `communityAccessApi.updateStaffRole`
- `communityAccessApi.removeStaff`
- `community-invitations.api` for member invites, if this is member invitation rather than staff assignment.

**How to fix:**

1. Confirm only the backend-backed `TeamPage` is exported.
2. Delete unused legacy types/components below the exported implementation:
   - `INIT_MEMBERS`
   - `INIT_INVITES`
   - `useLocalList`
   - fake invite modal
   - fake members table
3. If invite UI is kept, wire it to:

```ts
await communityAccessApi.assignStaffRole(selectedCommunityId, {
  userId,
  role,
})
```

4. If only email is available, add/require a user search endpoint before assigning staff. Do not create local invites.

## Backend Gap Items

Keep these as unavailable states until backend endpoints exist:

1. Admin moderation aggregates:
   - pending review counts
   - flagged-user aggregation
   - auto-mod rules and trigger metrics

2. Admin support:
   - community-scoped support ticket queue
   - live chat for community-role users
   - support analytics
   - support resources

3. Creator DM broadcasts:
   - no safe backend DM broadcast endpoint found
   - use Email/WhatsApp campaigns instead

4. Landing settings billing:
   - saved payment methods
   - user invoice history
   - user membership subscription listing

## Static Data To Quarantine

These modules should not be imported by runtime app/components except as pure types, tests, or marketing copy:

- `frontend/lib/mock-data.ts`
- `frontend/lib/data-communities.ts`
- `frontend/lib/dashboard-data.ts`

Recommended rule:

```bash
rg -n "@/lib/(mock-data|data-communities|dashboard-data)|lib/(mock-data|data-communities|dashboard-data)" frontend/app frontend/components -S --glob '!**/__tests__/**'
```

Allowed:

- Type-only imports in tests.
- Marketing copy modules like `frontend/lib/data.ts` for landing content.
- Placeholder images used as image fallbacks.

## Acceptance Criteria

The platform is clean when:

1. No runtime create/send flow writes business records to `localStorage`.
2. No runtime page imports `@/lib/mock-data`.
3. No page uses fake ids like `mock_${Date.now()}`, `event_${Date.now()}`, `prd_${Date.now()}`, or `session_${Date.now()}`.
4. Any unsupported feature displays an explicit unavailable/backend-required state.
5. `npm run build` passes.
6. `git diff --check` passes.

