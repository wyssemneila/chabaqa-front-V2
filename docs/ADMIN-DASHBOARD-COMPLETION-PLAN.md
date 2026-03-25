# Admin Dashboard Completion Plan

## Goal

Complete the admin dashboard so that all implemented backend admin capabilities are either:

- exposed in the UI and usable end to end
- intentionally deferred with a documented reason
- removed from the frontend backlog if no longer needed

This plan is based on the current backend admin module in `chabaqa-backend/src/admin`, the live-support admin endpoints in `chabaqa-backend/src/live-support`, and the admin frontend in `chabaqa-frontend/app/(admin)`.

## Current State Summary

### Already implemented and mostly wired

- Admin auth: login, 2FA, session restore, refresh, logout
- Dashboard overview widgets
- User management
- Community management
- Content moderation
- Financial dashboard, subscriptions, transactions, payouts
- Analytics dashboard
- Security audit logs and security events
- Communication campaigns, campaign detail/edit/create, templates
- Live support inbox with realtime socket updates

### Missing or incomplete

- Several backend admin endpoints exist without frontend coverage
- Root admin redirect is not capability-aware
- Admin UI localization and copy consistency are incomplete
- Some pages rely on response-shape guessing instead of strict contracts

## Delivery Principles

- Prefer backend contract alignment over frontend normalization hacks
- Finish vertical slices end to end: endpoint, client, UI, permissions, QA
- Ship the highest-value admin operations first
- Do not expose navigation items for unfinished modules
- Add typed response contracts for all admin API client methods

## Workstreams

## Workstream 1: Stabilize Admin Data Contracts ✅ DONE (2026-03-09)

### Objective

Reduce frontend fragility caused by inconsistent backend payload shapes and client-side guesswork.

### Tasks

- Audit every method in `chabaqa-frontend/lib/api/admin-api.ts`
- Document expected backend response shape for each admin endpoint
- Replace `any` and shape guessing with typed interfaces
- Standardize pagination parsing across users, communities, moderation, security, communication, and financial modules
- Remove client-side faux pagination where the backend should paginate
- Add integration tests around admin API response normalization

### Files

- `chabaqa-frontend/lib/api/admin-api.ts`
- `chabaqa-frontend/app/(admin)/__tests__/admin-api-integration.test.tsx`

### Acceptance Criteria

- Every admin client method has a typed input and typed output
- No admin page depends on undocumented fallback fields
- Pagination and list parsing are consistent across modules

### Completion Notes

- `admin-api.ts` now uses typed normalization helpers and consistent paginated payload contracts (`items`, `pagination`, `total`, `page`, `limit`, `totalPages`) across users, communities, moderation, security, communication, and financial list endpoints.
- Security events no longer use client-side faux pagination slicing; normalization now preserves backend-provided datasets.
- Legacy compatibility fields are still exposed where current admin pages rely on them (`data`, `users`, `communities`, `subscriptions`, `transactions`, `payouts`, `campaigns`), but they are now generated from one normalized source.
- Integration tests were upgraded from endpoint-existence checks to contract normalization assertions in `app/(admin)/__tests__/admin-api-integration.test.tsx`.

## Workstream 2: Finish Settings Module ✅ DONE (2026-03-09)

### Objective

Replace the placeholder settings page with real functionality.

### Current gaps

- Profile update is simulated in the frontend
- Password change is not connected to a real admin endpoint
- Platform settings tab is UI-only
- Alert configuration is only partially backed via analytics alerts

### Tasks

- Add dedicated backend admin profile/settings endpoints if missing
- Add endpoint for updating admin profile
- Add endpoint for changing admin password
- Decide scope of platform settings:
  - system-wide admin config
  - admin personal preferences
  - alert thresholds
- If platform settings belong to security/config modules, reuse those endpoints instead of inventing new ones
- Wire settings UI to real backend operations
- Add optimistic or explicit success/error states
- Refresh session state after profile changes

### Candidate backend coverage

- Reuse or extend:
  - `GET /admin/me`
  - security config endpoints
  - analytics alert endpoints

### Files

- `chabaqa-frontend/app/(admin)/admin/settings/page.tsx`
- `chabaqa-backend/src/admin/admin.controller.ts`
- potentially a new admin settings controller/service if required

### Acceptance Criteria

- Admin can update name/email through real API calls
- Admin can change password through a real API call
- Alert configuration persists and reloads correctly
- No simulated update logic remains

### Completion Notes

- `chabaqa-frontend/app/(admin)/admin/settings/page.tsx` now uses real admin session, profile, password, preferences, and analytics alert endpoints.
- Profile updates call `PUT /admin/profile`, password updates call `POST /admin/change-password`, and preferences use `GET/PUT /admin/settings/preferences`.
- Alert thresholds are persisted through analytics alert definitions and reloaded from the backend on page load.
- Session state is refreshed after profile updates via `syncSession()`.

## Workstream 3: Real Admin Notifications ✅ DONE (2026-03-09)

### Objective

Replace the placeholder notification bell with real counts and meaningful events.

### Current gaps

- Notification count is hardcoded in the header
- No notification list or source of truth

### Tasks

- Define notification model for admin-facing alerts
- Decide whether notifications are sourced from:
  - pending moderation
  - pending communities
  - unresolved security alerts
  - live support queue
  - analytics threshold alerts
- Add backend endpoint for notification summary
- Add optional endpoint for notification feed
- Wire header badge to live data
- Optionally add dropdown panel or dedicated notifications page

### Files

- `chabaqa-frontend/app/(admin)/_components/admin-header.tsx`
- backend admin notification source implementation

### Acceptance Criteria

- Badge count is loaded from API
- Count reflects real pending admin work
- Errors fail safely without breaking the header

### Completion Notes

- Admin notifications now aggregate pending moderation, pending community approvals, unresolved security alerts, live support queue items, and triggered analytics alerts.
- Backend endpoints were added for notification summary and notification feed under `/admin/notifications/*`.
- The admin header badge and dropdown now load live data and degrade safely to zero/empty state on API failure.

## Workstream 4: Complete Security Module UX ✅ DONE (2026-03-09)

### Objective

Turn security pages into full admin tools rather than partial list screens.

### Current gaps

- Audit log details use toast-only presentation
- Security event fetching is partially normalized in the frontend
- Several security backend features have no UI

### Missing backend-backed UI coverage

- Security config
- Audit report
- Compliance report
- Incident report
- Custom audit search/export
- Notification statistics
- Test alerts flow

### Tasks

- Build audit log detail modal or page
- Add security config page and forms
- Add reports page for:
  - audit report
  - compliance report
  - incident report
- Add advanced search UI for audit trail
- Wire export options to the real backend variants
- Align security event filters with backend-supported filters
- Remove client-side fake pagination for security alerts if backend can page/filter

### Files

- `chabaqa-frontend/app/(admin)/admin/security/page.tsx`
- `chabaqa-frontend/app/(admin)/admin/security/events/page.tsx`
- new routes under `chabaqa-frontend/app/(admin)/admin/security/*`
- `chabaqa-backend/src/admin/security-audit/security-audit.controller.ts`

### Acceptance Criteria

- Audit logs have a proper detail experience
- Security config can be viewed and updated in UI
- Reports can be generated from the UI
- Security filters reflect backend capabilities accurately

### Completion Notes

- Audit logs now have a proper detail dialog in `app/(admin)/admin/security/page.tsx` (no toast-only detail flow).
- Security config is wired to `GET/PUT /admin/security/config` and can be updated from the UI.
- Security reporting coverage now includes:
  - audit report (`/admin/security/audit/report`)
  - compliance report (`/admin/security/compliance/report`)
  - incident report (`/admin/security/incidents/:incidentId/report`)
  through `app/(admin)/admin/security/page.tsx`, `app/(admin)/admin/security/events/page.tsx`, and `app/(admin)/admin/security/reports/page.tsx`.
- Advanced audit search and export are now wired to backend endpoints:
  - `POST /admin/security/audit-trail/search`
  - `POST /admin/security/audit-trail/export/custom`
- Security events filters were aligned with backend-supported filters (`severity`, `type`, `resolved`).

## Workstream 5: Expose Missing Communication Features ✅ DONE (2026-03-09)

### Objective

Complete the communication module so it matches backend capabilities.

### Missing backend-backed UI coverage

- Notification config CRUD
- Template versions
- Restore template version
- Template preview
- Send test email/template
- Duplicate template
- Communication analytics screens beyond campaign list basics

### Tasks

- Add notification configuration page
- Add template detail page with:
  - preview
  - version history
  - restore version
  - duplicate
  - send test
- Add communication analytics page
- Ensure campaign and template flows use backend response contracts cleanly

### Files

- `chabaqa-frontend/app/(admin)/admin/communication/templates/page.tsx`
- new routes under `chabaqa-frontend/app/(admin)/admin/communication/*`
- `chabaqa-backend/src/admin/communication-management/communication-management.controller.ts`

### Acceptance Criteria

- Every major communication backend capability is reachable from the admin UI
- Templates can be previewed, tested, duplicated, and restored
- Notification config is manageable from the dashboard

### Completion Notes

- Notification configuration CRUD is now exposed in `app/(admin)/admin/communication/notifications/page.tsx`, wired to:
  - `GET /admin/communication/notifications/config`
  - `POST /admin/communication/notifications/config`
  - `PUT /admin/communication/notifications/config/:id`
  - `DELETE /admin/communication/notifications/config/:id`
- Template advanced actions are now available in `app/(admin)/admin/communication/templates/[id]/page.tsx`:
  - version history (`GET /admin/communication/templates/:id/versions`)
  - restore version (`POST /admin/communication/templates/:id/restore/:version`)
  - preview (`POST /admin/communication/templates/:id/preview`)
  - send test (`POST /admin/communication/templates/:id/test`)
  - duplicate (`POST /admin/communication/templates/:id/duplicate`)
- Templates list now links to the advanced management page from `app/(admin)/admin/communication/templates/page.tsx`.
- Communication analytics coverage was expanded with `app/(admin)/admin/communication/analytics/page.tsx`, including notification delivery stats via `GET /admin/communication/notifications/analytics/delivery-stats` and aggregated campaign analytics endpoints.
- `lib/api/admin-api.ts` now includes typed methods and normalization for communication notification config, template advanced actions, and notification delivery analytics.

## Workstream 6: Expose Admin Export and Bulk Operations ✅ DONE (2026-03-10)

### Objective

Use the existing backend export and data-management infrastructure in the frontend.

### Missing backend-backed UI coverage

- Export job creation and monitoring
- Export history
- Export download flow
- Bulk operation progress
- Cancel bulk operation
- Validation endpoint UI

### Tasks

- Add export center page
- Add export history table
- Add bulk operations monitor page
- Reuse existing frontend bulk-operation components where useful
- Add download and retry flows

### Files

- new routes under `chabaqa-frontend/app/(admin)/admin/export/*`
- new routes under `chabaqa-frontend/app/(admin)/admin/data-management/*`
- `chabaqa-backend/src/admin/common/controllers/export.controller.ts`
- `chabaqa-backend/src/admin/common/controllers/data-management.controller.ts`

### Acceptance Criteria

- Admin can create exports, monitor status, and download results
- Admin can inspect active bulk operations and cancel them when allowed

### Completion Notes

- Export center is now implemented in `app/(admin)/admin/export/page.tsx` with:
  - export job creation (`POST /admin/export/jobs`)
  - export history (`GET /admin/export/jobs`)
  - per-job status refresh (`GET /admin/export/jobs/:jobId`)
  - file download flow (`GET /admin/export/jobs/:jobId/download`)
  - failed-job retry from UI and expired-job cleanup (`POST /admin/export/cleanup`)
- Bulk operations monitor is now implemented in `app/(admin)/admin/data-management/page.tsx` with:
  - active operations feed (`GET /admin/data-management/bulk-operations/active`)
  - cancellation for running/pending jobs (`POST /admin/data-management/bulk-operations/:operationId/cancel`)
  - detailed progress dialog wired from normalized backend progress payloads
  - validation console wired to `POST /admin/data-management/validate`
- `lib/api/admin-api.ts` already includes typed/normalized clients for exports and data-management endpoints, and integration coverage now includes export and bulk-operation contract assertions in `app/(admin)/__tests__/admin-api-integration.test.tsx`.

## Workstream 7: Expand Analytics Coverage ✅ DONE (2026-03-10)

### Objective

Expose the full analytics surface, not just the dashboard page.

### Missing backend-backed UI coverage

- Generic analytics controller under `/admin/analytics`
- Comparative analytics
- health analytics
- report endpoint
- potentially user/financial/community analytics deep dives not surfaced cleanly

### Tasks

- Decide whether `/admin/analytics-dashboard` and `/admin/analytics` should coexist in UI
- If both stay, define:
  - executive dashboard
  - operational reports
- Add report generation UI
- Add comparative views if still needed
- Add health view if distinct from current analytics dashboard

### Files

- `chabaqa-frontend/app/(admin)/admin/analytics/page.tsx`
- potentially new routes under `chabaqa-frontend/app/(admin)/admin/analytics/*`
- `chabaqa-backend/src/admin/common/controllers/analytics.controller.ts`
- `chabaqa-backend/src/admin/analytics-dashboard/analytics-dashboard.controller.ts`

### Acceptance Criteria

- Analytics navigation reflects the real backend feature set
- Reporting and comparative endpoints are reachable from UI

### Completion Notes

- `chabaqa-frontend/lib/api/admin-api.ts` now exposes the `/admin/analytics/*` surface in `adminApi.analytics`:
  - `GET /admin/analytics/dashboard`
  - `GET /admin/analytics/user-growth`
  - `GET /admin/analytics/engagement`
  - `GET /admin/analytics/revenue`
  - `GET /admin/analytics/health`
  - `GET /admin/analytics/comparative`
  - `POST /admin/analytics/report`
- `chabaqa-frontend/app/(admin)/admin/analytics/page.tsx` now includes:
  - executive overview (existing dashboard analytics)
  - operational tab backed by `/admin/analytics/*` endpoints
  - reports tab with report type/format controls wired to `POST /admin/analytics/report`
  - continued export support through analytics export flow
- Integration coverage now includes expanded analytics endpoint contract access in `app/(admin)/__tests__/admin-api-integration.test.tsx`.

## Workstream 8: Capability-Aware Navigation and Access ✅ DONE (2026-03-10)

### Objective

Make routing and navigation respect backend capabilities and roles everywhere.

### Current gaps

- `/admin` always redirects to `/admin/dashboard`
- Some pages guard only on authentication, not capability
- Sidebar hides modules but direct route behavior should also be enforced

### Tasks

- Make root admin redirect choose the best landing page based on capabilities
- Add per-route capability checks
- Add friendly unauthorized states
- Verify all nav items align with backend permissions

### Files

- `chabaqa-frontend/app/(admin)/admin/page.tsx`
- `chabaqa-frontend/app/(admin)/admin/layout.tsx`
- `chabaqa-frontend/app/(admin)/providers/admin-auth-provider.tsx`
- `chabaqa-frontend/app/(admin)/_components/admin-sidebar.tsx`

### Acceptance Criteria

- Admin users land on a page they can actually access
- Direct navigation to unauthorized routes is handled cleanly

### Completion Notes

- Added shared capability-routing helpers in `app/(admin)/lib/admin-capability-routing.ts` to centralize:
  - capability-aware landing-page selection
  - route-level capability guard checks for admin routes
- `/admin` root redirect is now capability-aware in `app/(admin)/admin/page.tsx` and redirects authenticated admins to the first allowed admin route.
- Auth-page post-login redirect now uses capability-aware landing in `app/(admin)/providers/admin-auth-provider.tsx` instead of always forcing `/admin/dashboard`.
- Route-level capability enforcement is now handled in `app/(admin)/admin/layout.tsx` with a friendly unauthorized state and a safe path back to an allowed admin area.
- Sidebar navigation now aligns with capabilities for operations/support entry points in `app/(admin)/_components/admin-sidebar.tsx`.
- Added tests for routing and guard behavior in `app/(admin)/__tests__/admin-capability-routing.test.ts`.

## Workstream 9: UX, Copy, and I18N Completion ✅ DONE (2026-03-10)

### Objective

Finish the admin panel as a polished operational product.

### Current gaps

- Hardcoded English strings across many admin pages
- Inconsistent empty states and error states
- Partial localization only
- Some utility actions are hidden behind generic toasts

### Tasks

- Move remaining hardcoded admin strings into translation namespaces
- Standardize page-level loading, empty, and error states
- Replace toast-only detail views with proper panels/pages where needed
- Review mobile behavior for dense data tables
- Add QA pass for Arabic route support if admin is in localization scope

### Files

- all routes under `chabaqa-frontend/app/(admin)`
- admin translation namespaces

### Acceptance Criteria

- Admin route copy is consistently localized
- Empty/error/loading states are deliberate and usable
- No important workflow depends only on a toast message

### Completion Notes

- Added admin routing/capability UX copy localization keys in `messages/en.json` and `messages/ar.json` under:
  - `admin.routing.*`
  - `admin.menu.operations|exportCenter|bulkOperations`
- Wired localized copy into new capability-aware navigation/access flows:
  - `app/(admin)/admin/page.tsx` (capability-aware redirect message)
  - `app/(admin)/admin/layout.tsx` (friendly unauthorized state)
  - `app/(admin)/_components/admin-sidebar.tsx` (operations menu labels)
- Standardized direct-route unauthorized UX with clear recovery actions (go to allowed area / re-evaluate landing), replacing silent redirects.
- Verified no lint regressions after i18n and UX/copy updates.

## Suggested Phase Order

### Phase 1: Stabilization

- Workstream 1: data contracts
- Workstream 8: capability-aware routing
- bug fixes discovered during contract cleanup

### Phase 2: Critical missing functionality

- Workstream 2: settings
- Workstream 3: notifications
- Workstream 4: security UX completion

### Phase 3: Feature parity with backend

- Workstream 5: communication advanced features
- Workstream 6: export and bulk operations
- Workstream 7: analytics expansion

### Phase 4: Finish and polish

- Workstream 9: UX, copy, i18n, QA hardening

## Endpoint-to-UI Gap Checklist

### Implemented backend, missing UI

- `/admin/security/config`
- `/admin/security/audit/report`
- `/admin/security/compliance/report`
- `/admin/security/incidents/:incidentId/report`
- `/admin/security/audit-trail/search`
- `/admin/security/audit-trail/export/custom`
- `/admin/communication/notifications/config`
- `/admin/communication/notifications/config/:id`
- `/admin/communication/notifications/users/:userId/preferences`
- `/admin/communication/notifications/analytics/delivery-stats`
- `/admin/communication/templates/:id/versions`
- `/admin/communication/templates/:id/restore/:version`
- `/admin/communication/templates/:id/preview`
- `/admin/communication/templates/:id/test`
- `/admin/communication/templates/:id/duplicate`
- `/admin/export/jobs`
- `/admin/export/jobs/:jobId`
- `/admin/export/jobs/:jobId/download`
- `/admin/export/cleanup`
- `/admin/data-management/bulk-operations/:operationId/progress`
- `/admin/data-management/bulk-operations/active`
- `/admin/data-management/bulk-operations/:operationId/cancel`
- `/admin/data-management/validate`
- `/admin/analytics/dashboard`
- `/admin/analytics/user-growth`
- `/admin/analytics/engagement`
- `/admin/analytics/revenue`
- `/admin/analytics/health`
- `/admin/analytics/comparative`
- `/admin/analytics/report`

### Existing frontend that needs real backend completion

- Communication advanced features
- Export and bulk operation center
- Capability-aware landing/route guards

## QA Plan

### Automated

- Add admin API client integration tests for each module
- Add route-level tests for capability gating
- Add component tests for settings, security detail views, and notification badge

### Manual

- Login and 2FA
- Session refresh and logout
- CRUD and moderation flows
- Export/download flows
- Realtime support flows
- Unauthorized role access checks
- Localization checks on admin routes

## Definition of Done

- Every admin menu item is backed by real functionality
- Every exposed backend admin capability is either in the UI or explicitly deferred
- Placeholder and simulated admin actions are removed
- Response contracts are typed and stable
- Capability-based routing works
- Core admin flows pass manual QA and automated smoke coverage

## Recommended First Tickets

1. Type and stabilize `admin-api.ts`
2. Replace settings page simulated actions with real endpoints
3. Add audit log detail modal/page
4. Add real admin notification summary endpoint and wire header badge
5. Add security config UI
6. Add communication template advanced actions
7. Add export center and bulk operation monitor
8. Make `/admin` redirect capability-aware
