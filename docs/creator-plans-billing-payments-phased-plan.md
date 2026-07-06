# Creator Plans, Billing, Subscriptions, and Payments Phased Implementation Plan

Last reviewed: 2026-06-30

## Purpose

This document maps the current backend and frontend implementation for creator plans, billing, subscriptions, payments and payouts. It then turns the findings into a phased implementation plan.

The goal is to make the creator commercial system coherent end to end:

- Public landing pricing and `/pricing` must show the same plan data that the backend enforces.
- Creator account billing must be a real billing hub, not a placeholder.
- Subscription checkout must create and verify real provider payments.
- Creator revenue pages must clearly separate platform subscription billing from customer/member revenue.
- Payment success, payouts, and plan gating must all use the same backend truth.

## Source Map

### Backend Files Read

- `backend/src/infrastructure/database/schemas/commerce/plan.schema.ts`
- `backend/src/infrastructure/database/schemas/commerce/subscription.schema.ts`
- `backend/src/infrastructure/database/schemas/commerce/order.schema.ts`
- `backend/src/infrastructure/database/schemas/commerce/payout.schema.ts`
- `backend/src/shared/scripts/seed-plans.ts`
- `backend/src/shared/services/policy.service.ts`
- `backend/src/shared/guards/plan-feature.guard.ts`
- `backend/src/shared/services/fee.service.ts`
- `backend/src/shared/services/manual-payment.service.ts`
- `backend/src/shared/services/payment-fulfillment.service.ts`
- `backend/src/shared/services/payment-verification.service.ts`
- `backend/src/shared/controllers/payment.controller.ts`
- `backend/src/domains/commerce/subscription/subscription.controller.ts`
- `backend/src/domains/commerce/subscription/subscription.service.ts`
- `backend/src/domains/commerce/subscription/subscription.scheduler.ts`
- `backend/src/domains/commerce/payout/payout.controller.ts`
- `backend/src/domains/commerce/payout/payout.service.ts`

### Frontend Files Read

- `frontend/lib/plans/plan-config.ts`
- `frontend/hooks/use-plan.ts`
- `frontend/components/plan/feature-gate.tsx`
- `frontend/components/plan/upgrade-modal.tsx`
- `frontend/lib/api/subscription.api.ts`
- `frontend/lib/api/payments.api.ts`
- `frontend/lib/api/manual-payments.ts`
- `frontend/lib/hooks/use-payment-provider-modal.ts`
- `frontend/components/payment-provider-modal.tsx`
- `frontend/app/(landing)/pricing/page.tsx`
- `frontend/app/(landing)/components/pricing.tsx`
- `frontend/lib/data.ts`
- `frontend/app/(dashboard)/payment-success/payment-success-content.tsx`
- `frontend/app/api/payments/verify/route.ts`
- `frontend/app/api/payments/manual/init/community/route.ts`
- `frontend/app/(landing)/community/[slug]/checkout/components/checkout-form.tsx`
- `frontend/app/(creator)/creator/billing/page.tsx`
- `frontend/components/creator-dashboard/CreatorFeaturePage.tsx`
- `frontend/app/(creator)/creator/subscriptions/page.tsx`
- `frontend/app/(creator)/creator/payouts/page.tsx`
- `frontend/app/(creator)/creator/[...slug]/page.tsx`
- `frontend/app/(creator)/creator/components/dashboard-sidebar.tsx`
- `frontend/components/creator-dashboard/DashSidebar.tsx`

## Canonical Plan Data

The backend seed and `frontend/lib/plans/plan-config.ts` are currently the closest aligned source of truth. The landing homepage data in `frontend/lib/data.ts` is not aligned and should be replaced.

| Field | Starter | Growth | Pro |
| --- | --- | --- | --- |
| Monthly price | 39 TND | 99 TND | 159 TND |
| Yearly monthly display | 31 TND/mo | 79 TND/mo | 127 TND/mo |
| Yearly total | 372 TND/year | 948 TND/year | 1524 TND/year |
| Trial | 7 days | 7 days | 7 days |
| Communities | 1 | 1 | 1 |
| Members | 100 | 500 | Unlimited sentinel |
| Active courses | 3 | Unlimited sentinel | Unlimited sentinel |
| Storage | 5 GB | 50 GB | 300 GB |
| Admin seats | 1 | 2 | 3 |
| Email campaign recipients/month | 0 | 1000 | 15000 |
| WhatsApp messages/month | 0 | 250 | 1000 |
| Session bookings/month | 0 | 300 | 1000 |
| Analytics lookback | 30 days | 180 days | 365 days |
| Automation quota | 0 | 1000 | 15000 |
| Courses | Yes | Yes | Yes |
| Products | Yes | Yes | Yes |
| Challenges | No | Yes | Yes |
| Sessions | No | Yes | Yes |
| Events | No | Yes | Yes |
| Branding removal | No | No | Yes |
| Gamification | No | Yes | Yes |
| Verified badge | No | Yes | Yes |
| Featured badge | No | No | Yes |
| Transaction fee | 7.9% + 0.5 TND | 4.9% + 0.5 TND | 2.9% + 0.5 TND |

Notes:

- Backend enum includes `enterprise`, and frontend API enum includes `ENTERPRISE`, but the canonical frontend plan config exposes only `starter`, `growth`, and `pro`.
- Backend plan limits include AI fields: `aiAgentsMax`, `aiCofounderRunsPerMonth`, `aiKnowledgeReindexPerMonth`, and `aiStaffChatTurnsPerMonth`. These are snapshotted into subscriptions, but they are not represented in the canonical frontend plan config.
- `frontend/lib/data.ts` still claims mismatched marketing limits such as Growth having 3 communities and 10000 members, Pro having unlimited communities, and yearly totals of 390/990/1590 TND. Those must be deleted or replaced with canonical data.

## Backend Current State

### Plan Model

`Plan` stores:

- `tier`, `name`, monthly/yearly prices, trial days, active state.
- `limits`: communities, members, active courses, storage, admin seats, email recipients, WhatsApp messages, analytics days, sessions, and AI limits.
- `features`: courses, challenges, sessions, products, events, automation quota, branding, gamification, verified badge, featured badge.
- Transaction fee percent and fixed fee in TND.

The plan seed script creates Starter, Growth, and Pro with values matching `frontend/lib/plans/plan-config.ts`.

### Subscription Model

`Subscription` stores a creator's platform plan:

- `creatorId`
- optional `subscriberId`
- `plan`
- `provider`, `providerCustomerId`, `providerSubscriptionId`, `providerCheckoutSessionId`, `providerPriceId`
- `trialEndsAt`, `currentPeriodStart`, `currentPeriodEnd`, `nextBillingAt`
- `status`: `trialing`, `active`, `past_due`, `canceled`, `incomplete`
- `cancelAtPeriodEnd`
- plan limit snapshot fields
- payment card brand/last4
- amount, currency, and billing interval
- `hasPaymentMethod`

Important semantic issue: current creator-facing `GET /subscriptions/all` filters by `creatorId`, so it lists the creator's own platform subscription records, not customer/member subscriptions to a creator unless future code writes `subscriberId` and a different query path. The UI label "Customer Subscriptions" is therefore misleading today.

### Subscription API

Controller route: `/subscriptions`

Implemented endpoints:

| Endpoint | Purpose | Current reliability |
| --- | --- | --- |
| `POST /subscriptions/start-trial` | Create Starter trial for creator | Real, but not wired into pricing CTAs |
| `POST /subscriptions/setup-billing` | Store provider customer and masked card metadata | Partial, not a true provider setup flow |
| `POST /subscriptions/upgrade` | Directly upsert plan without provider checkout | Real mutation, risky if exposed as paid upgrade |
| `POST /subscriptions/cancel` | Set `cancelAtPeriodEnd` | Real local state |
| `GET /subscriptions/me` | Current creator plan | Real |
| `GET /subscriptions/trial-remaining` | Trial countdown | Real |
| `GET /subscriptions/stats` | Aggregate subscription records for creator | Real but semantically narrow |
| `GET /subscriptions/all` | Paginated subscription records for creator | Real but not customer membership subscriptions |
| `POST/GET/PUT/DELETE /subscriptions/plans` | Plan CRUD | Partial admin tooling; create/update DTOs are incomplete |
| `POST /subscriptions/export` | Returns mock CSV URL | Placeholder |
| `GET/POST /subscriptions/invoices` | Invoice methods | Placeholder/mock |
| `POST/GET /subscriptions/usage` | Usage record/summary | Partial, logs and returns mock usage summary |
| `POST /subscriptions/webhook` | Deprecated unsigned webhook | Returns gone; signed provider webhooks live under `/payment` |

### Subscription Lifecycle

`SubscriptionService` supports:

- `getPlanAmount(plan, interval)`: returns monthly price or yearly total.
- `startTrialForCreator`: creates a Starter trial and snapshots basic limits.
- `setupBillingMethod`: stores provider, provider customer ID, card brand, and card last4.
- `ensureActiveOrTrial`: can auto-activate an expired trial with a payment method into Starter for a fallback 30-day period.
- `upgradePlan`: loads an active plan, snapshots limits, stores provider/payment metadata, period dates, amount, currency, billing interval, and status.
- `cancelAtPeriodEnd`: marks future cancellation.
- provider webhook updates for subscription created, updated, deleted, invoice succeeded, invoice failed, trial ending, payment method attached/detached.

Scheduler:

- Runs only when `PLAN_ENFORCEMENT_MODE=true`.
- Hourly: active/trialing subscriptions past `currentPeriodEnd` become `past_due`.
- Hourly: trialing subscriptions past `trialEndsAt` without payment method become `past_due`.
- Daily: canceled subscriptions older than 90 days are marked archived.

### Plan Enforcement

Backend enforcement flag:

- `PLAN_ENFORCEMENT_MODE=true`

When enforcement is off:

- `PolicyService` returns generous unlimited limits.
- `PlanFeatureGuard` allows all features.

When enforcement is on:

- No subscription gets Starter-like baseline limits.
- Active or unexpired trial subscriptions count as active.
- Feature minimums:
  - Growth: challenges, sessions, events, automation quota, gamification, verified badge.
  - Pro: branding removal, featured badge.
- Numeric checks exist for communities, members, admins, and active courses.
- Quota helpers exist for automation, WhatsApp, email campaigns, and session bookings.
- Current backend usage examples found:
  - Challenges controller uses `@RequireFeature('challenges')`.
  - Sessions controller uses `@RequireFeature('sessions')`.
  - Events controller uses `@RequireFeature('events')`.
  - Course activation uses `canActivateMoreCourses`.
  - Community creation/admin/member additions use policy limit checks.
  - Email and WhatsApp services use monthly quotas.
  - Upload service checks storage limits.

### Transaction Fees

`FeeService.calculateForAmount(amountDT, creatorId)`:

- Default fee fallback: 9% + 0.5 TND.
- If creator has a subscription and plan, uses plan-specific `transactionFeePercent` and `transactionFixedFeeDT`.
- Computes platform fee and creator net.

Important frontend mismatch:

- Community checkout displays a hardcoded 5% platform fee, but backend fees depend on the creator's plan. The frontend must either fetch a backend quote or stop displaying an exact platform fee.

### Orders and Fulfillment

`Order` stores all paid commerce records:

- buyer, creator, optional community
- `contentType`: community, course, chapter, challenge, event, product, session, subscription
- amount, platform fee, creator net
- promo code and discount
- provider payment ID
- payment method: `stripe`
- status: `paid`, `refunded`, `pending`, `cancelled`
- Stripe provider metadata

`PaymentFulfillmentService` gives idempotent fulfillment states:

- `claimed`
- `completed`
- `requires_booking`
- `processing`
- `missing`
- `unclaimed`

`grantAccess` in `PaymentController` applies fulfillment:

- Community: add member and update joined communities.
- Subscription: call `subscriptionService.upgradePlan`.
- Course: enroll.
- Challenge: join challenge.
- Event: register attendee.
- Session: book session, possibly requiring slot selection.
- Product: mark order paid and count sale.
- Chapter: persist chapter entitlement.

### Payment Providers

Controller route: `/payment`

`main.ts` also aliases `/api/payments/*` to `/api/payment/*`.

Provider enablement:

- Stripe is treated as generally available in frontend modal.
- Legacy local provider is available in frontend when not production or `NEXT_PUBLIC_PAYMENT_ENABLE_KONNECT=true`.
- Backend strict production requires:
  - `PAYMENT_ENABLE_FLOUCI=true`
  - `PAYMENT_ENABLE_KONNECT=true`
- Backend validates redirect overrides against `PAYMENTS_REDIRECT_ALLOWLIST` or `FRONTEND_URL`.

Subscription payment endpoints:

| Provider | Endpoint | Status |
| --- | --- | --- |
| Stripe | `POST /payment/stripe-link/init/subscription` | Best implemented path |
| Stripe | `GET /payment/stripe-link/verify?sessionId=` | Verifies session and grants subscription |
| Stripe | `POST /payment/stripe-link/webhook` | Signed webhook, deduped, grants/reconciles |
| Stripe | `POST /payment/stripe-link/customer-portal` | Requires stored provider customer ID |
| Legacy local provider | `POST /payment/legacy-local-provider/init/subscription` | Present, but amount field is wrong |
| Legacy local provider | `GET /payment/legacy-local-provider/verify?paymentRef=` | Verifies and grants |
| Legacy wallet provider | `POST /payment/init/subscription` | Present, but amount field is wrong and not used by modal |

Critical bug:

- legacy local providers subscription init read `(plan as any).priceMonthlyDT || (plan as any).priceDT || 0`, but the schema uses `priceDTPerMonth`, `yearlyPriceDTPerMonth`, and `yearlyTotalDT`. These endpoints can return "Montant invalide" for real plans.

Content payment endpoints:

| Content type | Stripe |
| --- | --- |
| Community | Yes |
| Course | Yes |
| Chapter | Yes |
| Challenge | Yes |
| Event | Yes |
| Product | Yes |
| Session | Yes |
| Subscription | Yes |

### Stripe-Only Payment Policy

Production checkout is Stripe-only across platform subscriptions and content purchases.

### Payouts

Backend payout route: `/payouts`

Core rules:

- A payout must include `communityId`.
- Community must exist and belong to creator.
- Bank transfer requires Tunisian bank credentials:
  - RIB exactly 20 digits.
  - bank name.
  - account holder name.
- Minimum payout defaults to `PAYOUT_MIN_AMOUNT_DT`, then `AFFILIATE_MIN_PAYOUT_DT`, then 50 TND.
- Available balance = sum of paid orders' `creatorNetDT` minus completed, pending, and scheduled payouts.
- Payout statuses: `pending`, `completed`, `failed`, `cancelled`, `scheduled`.
- Methods: `bank_transfer`, `paypal`, `stripe`.
- Scheduled payouts are released hourly.

Endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /payouts` | Request payout |
| `GET /payouts` | List payouts with filters |
| `GET /payouts/stats` | Creator payout stats |
| `GET /payouts/available-balance` | Available creator balance |
| `GET /payouts/bank-credentials` | Read bank credentials |
| `PUT /payouts/bank-credentials` | Update bank credentials |
| `GET /payouts/:id` | Read payout |
| `PUT /payouts/:id` | Update payout |
| `POST /payouts/:id/process` | Mark completed |
| `POST /payouts/:id/cancel` | Cancel payout |
| `DELETE /payouts/:id` | Marks cancelled |

Frontend state:

- `/creator/payouts` and `/creator/monetization/payouts` exist.
- It loads payouts, stats, available balance, and bank credentials.
- It validates RIB locally.
- It requests payout with selected community.
- Gap: `paymentsApi.getPayouts`, `getPayoutStats`, and `getAvailableBalance` do not expose `communityId` params, so the selected community is used for creating payout but not for filtering balance/stats/list.

## Frontend Current State

### Canonical Plan Config

`frontend/lib/plans/plan-config.ts` mirrors the backend seed for Starter/Growth/Pro.

It provides:

- `PLANS`
- `PLAN_TIERS`
- `PLAN_ENFORCEMENT_MODE`
- `minimumPlanForFeature`
- `minimumPlanForLimit`
- labels
- `formatLimit`
- add-ons for extra admin seat and extra storage

The frontend enforcement flag is:

- `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=true`

When disabled, `usePlan()` returns Pro and all features are allowed.

### Plan UI Components

Current components:

- `usePlan`: loads `/subscriptions/me` when enforcement is enabled.
- `FeatureGate`: hides/gates UI for unavailable plan features.
- `UpgradeModal`: displays eligible upgrade plans and redirects to `/pricing?plan=...&billing=...`.
- `UsageIndicator`: displays usage against limits.

Gap:

- `/pricing` does not currently read `plan` and `billing` query params, so `UpgradeModal` cannot preselect the intended plan/billing state.

### Landing Homepage Pricing Component

`frontend/app/(landing)/components/pricing.tsx` uses `siteData.pricing.plans` from `frontend/lib/data.ts`.

Current problems:

- The data is not aligned with backend plan seed or canonical frontend plan config.
- The CTA links to `/dashboard/create-community`, not subscription checkout.
- It does not use `PaymentProviderModal`.
- It duplicates plan presentation logic that already exists on `/pricing`.
- It uses browser-only random confetti inside event-driven code, which is okay after hydration, but the component should stay deterministic on initial render.

Required direction:

- Replace its data source with `PLANS`.
- Decide whether homepage pricing CTA opens payment checkout or links to `/pricing`.
- If checkout opens directly, use the same `PaymentProviderModal` and subscription init handlers as `/pricing`.
- If linking to `/pricing`, pass `?plan=<tier>&billing=<monthly|yearly>` and make `/pricing` consume it.

### Pricing Page

`frontend/app/(landing)/pricing/page.tsx` is the current real subscription checkout page.

Current behavior:

- Uses `PLANS` from `frontend/lib/plans/plan-config.ts`.
- Provides monthly/yearly toggle.
- Shows plan cards, comparison rows, add-ons, FAQ, and CTA.
- Opens `PaymentProviderModal`.
- Stripe init calls `subscriptionApi.initStripePayment(tier, interval)`.
- Legacy local provider init calls `subscriptionApi.initLegacy local providerPayment(tier)`.

Problems:

- The page copy says "No credit card required", but the CTA opens provider checkout. Stripe may still apply a trial, but the user is entering a checkout flow.
- `Start Free Trial` does not call `/subscriptions/start-trial`.
- The auth error redirect is `/auth/register?billing=...`, but the actual routes are `/signup` and `/signin`.
- Comparison rows advertise unsupported or unproven fields:
  - custom domain
  - priority support
  - social media promo
  - CSV export
- Legacy local provider subscription checkout is wired but backend amount bug blocks it.
- Add-ons are displayed but no backend purchase or enforcement flow exists for add-ons.

### Payment Provider Modal

`PaymentProviderModal` supports:

- Stripe, labeled "International Card".
- Legacy local provider, conditionally available.
- Stripe only.

Current gap:

- Checkout should expose Stripe only.

### Payment Success Page

`frontend/app/(dashboard)/payment-success/payment-success-content.tsx`:

- Reads `sessionId`, `paymentRef`, `paymentId`, `orderId`, `scope`, `provider`, and `id`.
- Uses `/api/payments/verify`, which proxies to backend provider verification.
- Retries verification with short backoff.
- Normalizes provider payloads through `toPaymentViewModel`.
- Redirects:
  - course to course page
  - chapter to course page with paid chapter query
  - community to community home after polling joined communities
  - session to sessions
  - event to event QR
  - subscription to `/creator/billing?checkout=success`

Gap:

- Subscription success lands on a placeholder billing page today.

### Creator Billing Page

`/creator/billing` currently renders `CreatorFeaturePage` with the `billing` variant.

It is a placeholder:

- Static plan metric "Creator"
- Static invoices count 0
- Static status active
- Static panels for payment method and invoice center
- Links to payouts and subscriptions

Required direction:

- Replace with a real account billing hub connected to `/subscriptions/me`, `/subscriptions/trial-remaining`, `/subscriptions/invoices`, Stripe customer portal, and checkout routes.

### Creator Subscriptions Page

`/creator/subscriptions` and `/creator/monetization/subscriptions`:

- Load `subscriptionApi.getAllSubscriptions` and `getSubscriptionStats`.
- Display revenue, active, trial, canceled, search, status filter, export, and a subscription table.

Problem:

- Backend `getAllSubscriptions` filters by the creator as the platform subscription owner. It is not a customer subscription revenue ledger. The UI title and sidebar label "Customer Subscriptions" should be corrected or a real customer-membership subscription model/API should be added.

### Creator Payouts Page

`/creator/payouts` and `/creator/monetization/payouts`:

- Load payout list, stats, available balance, and bank credentials.
- Validate and update Tunisian bank credentials.
- Request payout from selected community.

Problems:

- Payout list/stats/balance do not pass selected `communityId`.
- API wrapper lacks community filter params for stats and balance.
- The page should show the backend minimum payout amount when a payout is blocked.

### Creator Payments Page

Creator revenue pages should focus on Stripe-paid orders, payouts, and subscription billing.

### Content Pricing Surfaces

Creator-side pricing controls exist across content:

- Community creation pricing step.
- Course creation and manage pricing.
- Product creation and manage pricing.
- Session pricing/duration step.
- Challenge timeline/pricing step.
- Event ticket pricing.

These should remain content pricing tools, separate from platform subscription billing.

## Current End-to-End Payment Flow

### Subscription Checkout Flow Today

1. User opens `/pricing`.
2. User chooses a plan.
3. Frontend opens `PaymentProviderModal`.
4. For Stripe:
   - Frontend calls `POST /payment/stripe-link/init/subscription`.
   - Backend loads plan, calculates amount using `getPlanAmount`, creates pending subscription order, creates Stripe price, creates Stripe subscription checkout session with trial days, stores session ID, and returns checkout URL.
   - User pays or starts trial in Stripe.
   - Stripe redirects to `/payment-success?scope=subscription&tier=...&provider=stripe&sessionId=...`.
   - Frontend calls `/api/payments/verify?sessionId=...`.
   - Backend verifies Stripe session, claims order, grants subscription by calling `upgradePlan`, and marks fulfillment completed.
   - Frontend redirects to `/creator/billing?checkout=success`.
5. For Legacy local provider:
   - Frontend can call backend, but backend subscription amount field is currently wrong.

### Homepage Landing Pricing Flow Today

1. User lands on home page.
2. Homepage `Pricing` reads stale `siteData.pricing.plans`.
3. CTA links to `/dashboard/create-community`.
4. No plan is selected and no payment provider is opened.

This means the homepage pricing section is disconnected from subscription payments.

### Community Checkout Flow Today

1. User opens a paid community checkout.
2. Frontend displays price and a hardcoded platform fee.
3. For paid communities, frontend opens `PaymentProviderModal`.
4. Stripe init calls community payment endpoints.
5. Success page verifies payment and redirects to community home.
6. For free communities, frontend directly calls `communitiesApi.join`.

Gap:

- Checkout is Stripe-only; displayed platform fee must be backend-derived.

## Critical Gaps To Fix Or Delete

1. Plan data is duplicated and inconsistent.
   - Keep `seed-plans.ts` and `plan-config.ts` aligned.
   - Replace `siteData.pricing.plans`.
   - Remove unsupported marketing claims.

2. `/creator/billing` is a placeholder.
   - It must become the account billing hub.

3. Homepage pricing does not initiate or link correctly to payment.
   - It must use canonical plan data and route to checkout.

4. `/pricing` does not consume `?plan` and `?billing`.
   - Upgrade modal redirects lose context.

5. Trial copy conflicts with checkout behavior.
   - Either implement true no-card trial via `/subscriptions/start-trial`, or change copy to say checkout starts the trial.

6. Wrong auth fallback path.
   - Replace `/auth/register` with `/signup` or `/signin` plus redirect params.

7. legacy local providers subscription amount fields are wrong.
   - Use `subscriptionService.getPlanAmount(plan, interval)` and accept interval.

8. Keep checkout and docs Stripe-only.

10. Pricing comparison advertises unsupported features.
    - Delete or implement custom domain, priority support, social promotion, CSV export, add-on purchase flows, and Enterprise.

11. Customer subscriptions page is semantically wrong.
    - Rename to "Account Subscriptions" if using current API, or build real customer subscription endpoints.

12. Payout page ignores selected community for balance/stats/list.
    - Pass `communityId` through API wrapper and page loads.

13. Community checkout fee display is wrong.
    - Fetch backend quote or remove exact platform fee display.

14. Invoices, export, and usage APIs are partial.
    - Billing hub should label them correctly or hide them until real.

## Phased Implementation Plan

### Phase 0: Product Contract Lock

Objective:

Create one contract for what plans, billing, and creator revenue pages mean.

Backend tasks:

- Confirm that `Subscription` is for the creator's platform plan, not member subscriptions.
- Confirm whether `subscriberId` will be used later or removed from creator-facing subscription pages.
- Confirm whether Enterprise is a real self-service tier or delete it from public API types.
- Confirm whether add-ons are roadmap or required for launch.

Frontend tasks:

- Rename sidebar labels if needed:
  - Account Billing: platform subscription billing.
  - Payouts: creator withdrawal workflow.
  - Customer Subscriptions: only if backed by member subscription API; otherwise rename.
- Decide homepage pricing CTA:
  - Link to `/pricing?plan=...&billing=yearly`.
  - Or open provider modal directly with the same handlers as `/pricing`.

Acceptance criteria:

- A written decision exists for every advertised plan feature.
- Anything not backed by backend schema/API/enforcement is removed from public pricing.
- The team agrees on whether "subscription" means platform plan, customer membership, or both with separate routes.

### Phase 1: Canonical Plan Source And Pricing Cleanup

Objective:

Make all public plan displays use the same plan values.

Backend tasks:

- Keep `seed-plans.ts` as the backend seed for Starter/Growth/Pro.
- Add a small backend test that confirms seeded plan values and transaction fees.
- Decide whether plan CRUD is admin-only and protect it accordingly if not already done globally.
- Extend plan update DTOs if plan admin editing should support all limit and feature fields.

Frontend tasks:

- Replace `frontend/lib/data.ts` pricing data usage with `frontend/lib/plans/plan-config.ts`.
- Update homepage `Pricing` to use `PLAN_TIERS` and `PLANS`.
- Delete unsupported homepage claims:
  - Growth 3 communities.
  - Growth 10000 members.
  - Pro unlimited communities.
  - Custom domain.
  - VIP/24-7 support unless backed.
  - Social media promo unless backed.
- Align yearly totals everywhere:
  - Starter 372.
  - Growth 948.
  - Pro 1524.
- Convert comparison rows into derived rows from `PLANS` where possible.
- Keep only manually written rows for actually supported backend fields.

Acceptance criteria:

- Homepage pricing and `/pricing` show the same prices, limits, features, and fees.
- No public pricing surface advertises an unsupported feature.
- Snapshot or component tests catch future pricing drift.

### Phase 2: Subscription Trial And Checkout Flow

Objective:

Make trial and payment behavior truthful, provider-safe, and reliable.

Backend tasks:

- Fix legacy local providers subscription amount lookup:
  - Accept `interval`.
  - Use `subscriptionService.getPlanAmount(plan, interval)`.
  - Store `billingInterval`, `tier`, `provider`, `amount`, and `currency` in order metadata.
- Decide whether `/subscriptions/start-trial` creates a no-card trial. If yes, expose it from pricing before checkout.
- Keep Stripe subscription checkout as the paid/card trial path.
- Add provider-specific tests:
  - Stripe init returns checkout URL and creates pending order.
  - Legacy local provider init uses correct amount.
  - Legacy wallet provider init uses correct amount or is hidden.
  - Verification grants subscription idempotently.

Frontend tasks:

- Make `/pricing` read `plan` and `billing` query params.
- Fix `UpgradeModal` flow by preserving selected tier/billing.
- Replace `/auth/register` redirects with `/signup` or `/signin` and a return URL.
- Make CTA copy match behavior:
  - If no-card: "Start free trial".
  - If provider checkout: "Start trial with checkout" or "Subscribe".
- Pass `interval` to Legacy local provider when backend supports it.
- Show provider-specific errors without losing selected plan.

Acceptance criteria:

- A user can click upgrade from a gated feature and land on `/pricing` with correct plan and billing selected.
- Stripe subscription checkout succeeds, verifies, and redirects to a real billing page.
- Legacy local provider subscription checkout either works or is hidden.
- Copy no longer promises "No credit card required" unless `/subscriptions/start-trial` is the actual path.

### Phase 3: Real Creator Account Billing Hub

Objective:

Replace `/creator/billing` placeholder with a real billing workspace.

Backend tasks:

- Ensure `/subscriptions/me` returns all fields needed by UI:
  - plan, status, interval, period dates, trial date, cancel state, amount, currency, payment brand/last4, provider.
- Add or expose Stripe portal link endpoint cleanly through frontend API.
- Either implement real invoices or hide invoice center until provider invoices are available.
- Decide whether `/subscriptions/upgrade` should require payment verification or be admin-only.

Frontend tasks:

- Replace `CreatorFeaturePage` billing variant usage in `frontend/app/(creator)/creator/billing/page.tsx`.
- New billing hub sections:
  - Current plan card.
  - Trial countdown.
  - Billing interval and next billing date.
  - Payment method summary.
  - Plan limits/usage.
  - Upgrade/downgrade CTA.
  - Cancel at period end CTA.
  - Provider portal CTA for Stripe customers.
  - Checkout success alert when `?checkout=success`.
- Reuse `PLANS`, `usePlan`, `UsageIndicator`, and `PaymentProviderModal`.
- Do not show invoice export as functional unless backed by real invoice data.

Acceptance criteria:

- `/payment-success?scope=subscription...` redirects to a useful billing page.
- Creator can see current plan and billing status.
- Creator can start upgrade checkout from billing.
- Creator can cancel at period end.
- Empty invoice state is honest.

### Phase 4: Plan Enforcement UI And API Alignment

Objective:

Make backend plan restrictions and frontend gates tell the same story.

Backend tasks:

- Audit all creator feature creation endpoints:
  - challenges
  - events
  - sessions
  - active courses
  - communities
  - members
  - admins
  - uploads/storage
  - email campaigns
  - WhatsApp campaigns
  - analytics lookback
- Return consistent machine-readable errors for plan gates:
  - `requiredPlan`
  - `currentPlan`
  - `feature`
  - `limit`
  - `currentUsage`
  - `currentLimit`
- Add tests for `PolicyService`, `PlanFeatureGuard`, and quota services.

Frontend tasks:

- Ensure creator feature forms wrap gated features with `FeatureGate`.
- Use backend gate error payloads to open `UpgradeModal`.
- Add `UsageIndicator` on dashboard and relevant creation pages.
- Make plan enforcement disabled mode obvious only in developer/admin environments, not public UI.

Acceptance criteria:

- Backend rejects gated actions when enforcement is on.
- Frontend prevents or explains the same blocked actions before submit.
- Upgrade modal always routes to the right plan.

### Phase 5: Creator Revenue Subscriptions Page Decision

Objective:

Resolve the ambiguous `/creator/subscriptions` page.

Option A: Keep it as platform subscription history.

- Rename page to "Account Subscription History".
- Use `/subscriptions/all` and `/subscriptions/stats`.
- Move it under account billing, not monetization.

Option B: Make it customer/member subscriptions.

Backend tasks:

- Add a separate schema or extend existing subscription usage for customer subscriptions.
- Query by creator revenue ownership and `subscriberId`.
- Include community/product membership context.
- Add churn, MRR, ARR, subscriber email, plan/package, and renewal status.

Frontend tasks:

- Keep `/creator/monetization/subscriptions` as customer subscriptions.
- Show buyer/member context, community, revenue, provider, renewal, and status.
- Keep `/creator/billing` for platform account subscription.

Acceptance criteria:

- Page title, sidebar label, API data, and metrics all mean the same thing.
- No creator sees their own platform subscription described as customer revenue.

### Phase 6: Stripe Checkout Hardening

Objective:

Keep checkout, verification, and billing support Stripe-only.

Backend tasks:

- Remove any remaining manual provider flags/routes.
- Ensure every paid content path starts a Stripe checkout session.
- Keep payment audit logs keyed by Stripe IDs and order IDs.

Frontend tasks:

- Keep checkout modal Stripe-only.
- Remove stale manual review pages, API wrappers, and sidebar entries.

Acceptance criteria:

- Buyer can pay supported content through Stripe and access is granted through existing fulfillment.

### Phase 7: Payouts And Revenue Reconciliation

Objective:

Make payouts accurate, community-aware, and explainable.

Backend tasks:

- Confirm all paid orders set `communityId` where possible.
- Keep available balance based on `creatorNetDT`.
- Expose minimum payout amount in balance or config response.
- Return blocked payout reasons with current balance and minimum amount.
- Decide if payout amount is TND units everywhere; current schema comments and UI should agree.

Frontend tasks:

- Extend `paymentsApi.getPayouts`, `getPayoutStats`, and `getAvailableBalance` to accept:
  - `communityId`
  - status
  - method
  - date range
  - pagination
- Pass selected community ID from `/creator/payouts`.
- Display minimum payout amount.
- Show why a payout cannot be requested:
  - no community selected
  - invalid bank details
  - below minimum
  - exceeds available balance
- Add reconciliation card:
  - gross paid orders
  - platform fees
  - creator net
  - pending payouts
  - completed payouts
  - available balance

Acceptance criteria:

- Selected community changes payout balance, stats, and history.
- Creator sees the exact amount available to withdraw.
- Failed payout requests explain backend validation clearly.

### Phase 8: Landing To Payments Integration

Objective:

Connect public acquisition pages to subscription checkout without duplicating logic.

Backend tasks:

- No new backend schema required if Phase 2 is complete.
- Ensure redirect allowlist includes deployed frontend and local frontend URLs.

Frontend tasks:

- Refactor homepage `Pricing` to share plan card data with `/pricing`.
- Recommended simplest path:
  - Homepage CTA links to `/pricing?plan=<tier>&billing=yearly`.
  - `/pricing` opens checkout with selected tier.
- Alternative:
  - Homepage CTA directly opens `PaymentProviderModal`.
  - Use the same `subscriptionApi.initStripePayment` and `initLegacy local providerPayment` handlers.
- Remove stale `siteData.pricing.plans`.
- Ensure `localizeHref` keeps query strings intact.
- Ensure mobile plan cards do not overflow.

Acceptance criteria:

- Landing page pricing, `/pricing`, and upgrade modal all lead to the same checkout flow.
- No stale plan values remain in public landing data.
- Payment success always returns to real billing.

### Phase 9: Payment Quote And Checkout Accuracy

Objective:

Make checkout totals and fees match backend math.

Backend tasks:

- Add quote endpoints if needed:
  - community quote
  - course quote
  - challenge quote
  - event quote
  - product quote
  - session quote
  - subscription quote
- Quote should include:
  - base price
  - promo discount
  - platform fee
  - creator net
  - total buyer charge
  - currency
  - provider availability
- Reuse `FeeService`.

Frontend tasks:

- Community checkout should fetch quote or hide exact platform fee.
- Paid content checkout should show the backend-calculated total.
- Promo code field should validate with backend before displaying discount.
- Provider modal should receive provider availability from config or backend, not hardcoded only.

Acceptance criteria:

- Amount displayed before checkout equals amount used to create the order.
- Plan-specific creator transaction fees are visible to creators in billing/analytics, not incorrectly charged to buyers.

### Phase 10: Invoices, Usage, Exports, And Add-ons

Objective:

Turn placeholder billing features into real features or remove them.

Backend tasks:

- Invoices:
  - Pull Stripe invoices for Stripe subscriptions.
  - Store or proxy invoice PDF URL and status.
- Usage:
  - Add usage collection or aggregate from real domain data.
  - Replace mock usage summary.
- Export:
  - Generate real CSV files or stream CSV responses.
- Add-ons:
  - Decide schema and checkout flow for admin seats and storage.

Frontend tasks:

- Billing hub invoice table should only show real invoices.
- Usage cards should use real usage endpoints or computed domain stats.
- Add-ons UI should be hidden until backend purchase and enforcement exist.

Acceptance criteria:

- No placeholder exports, invoices, or usage values appear in production.
- Add-ons cannot be purchased visually unless billing and enforcement exist.

### Phase 11: Admin Financial Controls

Objective:

Keep creator billing operations observable and supportable.

Backend tasks:

- Ensure admin plan CRUD, subscription updates, payout processing, and payment audit logs are permission guarded.
- Add audit log entries for:
  - plan changes
  - subscription checkout
  - subscription webhook updates
  - payout processing/cancellation

Frontend tasks:

- Admin financial subscription and payout pages should show provider IDs, order IDs, audit trail, and retry state.
- Add provider webhook status and support references.

Acceptance criteria:

- Support can trace a payment from checkout to order to fulfillment to payout.
- Admin operations are permission checked.

### Phase 12: Test And Launch Rollout

Objective:

Ship safely with high confidence.

Backend tests:

- `seed-plans` values match expected tiers.
- `SubscriptionService.getPlanAmount` monthly/yearly.
- Stripe subscription init creates order and metadata.
- Legacy local provider subscription init uses correct amount.
- Legacy wallet provider subscription init uses correct amount or is disabled.
- Stripe verify is idempotent.
- `PolicyService` feature and limit checks.
- `FeeService` default and plan-specific fees.
- Payout available balance and minimum payout validation.

Frontend tests:

- Plan config renders consistently on homepage and `/pricing`.
- `/pricing?plan=growth&billing=monthly` preselects Growth monthly.
- Upgrade modal redirects with correct params.
- Payment modal hides unavailable providers by scope.
- Payment success subscription redirects to billing.
- Billing hub handles active, trialing, past_due, canceled, and no subscription.
- Payout page passes community ID to all payout API calls.

Playwright smoke:

- Log in as a creator.
- Visit `/pricing?plan=growth&billing=yearly`.
- Start Stripe checkout in test mode.
- Return to payment success.
- Confirm `/creator/billing?checkout=success` shows plan and status.
- Visit homepage pricing and verify CTA routes to same flow.
- Create or use a paid community, checkout, verify access.
- Request payout from selected community and verify validation states.

Launch checklist:

- `PLAN_ENFORCEMENT_MODE` and `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE` intentionally set.
- Provider flags set for production.
- Redirect allowlist contains production frontend URL.
- Stripe webhook secret configured.
- Legacy local provider webhook URL configured if enabled.
- Public pricing has no unsupported claims.
- Billing placeholder removed.

## Recommended Implementation Order

1. Fix plan data drift and delete unsupported pricing claims.
2. Make `/pricing` query-aware and fix auth redirects/copy.
3. Fix legacy local providers subscription amount bugs or hide those providers for subscriptions.
4. Replace `/creator/billing` with a real subscription billing hub.
5. Connect homepage pricing to `/pricing` or checkout.
6. Resolve `/creator/subscriptions` semantics.
8. Make payout page community-aware.
9. Add payment quote endpoints and remove hardcoded frontend fees.
10. Replace placeholder invoices, usage, and export behavior.

## Definition Of Done

The system is ready when:

- One canonical plan source powers public pricing, gated UI, and backend enforcement.
- A creator can start trial or checkout from landing, pricing, upgrade modal, and billing with consistent behavior.
- Subscription payment verification creates or updates the creator subscription and lands on a useful billing hub.
- Creator revenue pages are clearly named and backed by matching APIs.
- Stripe payment verification works where advertised.
- Payout balances reconcile with paid order creator net.
- Unsupported options are either implemented or removed from the UI.
- Tests cover plan math, provider init, verification, enforcement, payouts, and key frontend flows.
