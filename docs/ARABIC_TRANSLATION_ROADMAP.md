# Arabic Localization Completion Plan

**Version:** 2.0  
**Prepared on:** 2026-03-07  
**Scope:** Full web app Arabic readiness (`/ar`) including UX copy, RTL, metadata, and QA

## 1) Executive Summary
This plan completes Arabic localization for the entire website and product surfaces in a controlled sequence:
1. Finish public + auth first (highest user impact).
2. Complete creator and community experience (largest untranslated surface).
3. Complete admin backoffice.
4. Harden RTL + accessibility + SEO, then release behind quality gates.

## 2) Baseline (Current State)

### Foundation already available
- `next-intl` provider configured globally in `app/layout.tsx`.
- Supported locales in `lib/i18n/config.ts`: `en`, `ar`.
- Locale catalogs in place:
  - `messages/en.json`
  - `messages/ar.json`
- Parity tool is passing:
  - `node scripts/i18n/check-parity.mjs` -> passed (343 keys).
- Runtime fallback available:
  - `ArabicAutoTranslate` (guarded by `NEXT_PUBLIC_ENABLE_ARABIC_AUTO_TRANSLATE=true`).

### Coverage reality
- Total route page files: **97** (`page.tsx`).
- Route pages with direct `next-intl` usage: **9**.
- Route pages without direct `next-intl` usage: **88**.

### Remaining route groups (largest first)
- `app/(creator)/creator/*`: **32 pages**.
- `app/(admin)/*`: **21 pages**.
- `app/(community)/*`: **15 pages**.
- `app/(landing)/*`: **13 pages** still needing direct page-level localization work.
- `app/(auth)/*`: **3 pages** (`forgot-password`, `reset-password`, `verify-email`).

## 3) Target Outcomes
Ship complete, production-ready Arabic UX with:
- Accurate Arabic terminology and style consistency.
- Full RTL visual correctness (`dir="rtl"` + mirrored layout behavior).
- Localized labels, placeholders, toasts, errors, empty states, and metadata.
- No critical hardcoded English/French copy on Arabic routes.

## 4) Success Metrics (Definition of Success)
A release is considered complete only when all are true:
- Route localization coverage: **100% of in-scope pages pass route DoD**.
- Key quality:
  - `npm run i18n:check:parity` passes.
  - No missing key runtime errors in browser logs on Arabic flows.
- Hardcoded text quality:
  - Scoped hardcoded scans show **0 critical user-facing findings**.
- RTL quality:
  - Visual QA pass complete for desktop + mobile.
- Accessibility quality:
  - No blocking Arabic a11y regressions in forms/navigation.
- E2E quality:
  - Arabic smoke tests pass for top critical journeys.

## 5) Non-Goals (to avoid scope creep)
- No redesign of existing UI architecture.
- No major refactor of business logic unless required for localization safety.
- No replacement of translation framework (`next-intl` remains standard).

## 6) Execution Model

### Workstream A: Key Architecture and Content Governance
Deliverables:
- Namespace expansion and stabilization:
  - `landing.*`, `auth.*`, `creator.*`, `community.*`, `admin.*`, `forms.*`, `errors.*`, `validation.*`, `common.*`.
- Key naming standard:
  - `domain.page.section.element`.
  - Example: `creator.dashboard.cards.totalRevenue.label`.
- Controlled product glossary (Arabic source-of-truth).

### Workstream B: Route & Component Wiring
Deliverables:
- Replace hardcoded literals with translation keys.
- Apply `useTranslations` or `getTranslations` on each route/component boundary.
- Keep locale-safe links using `localizeHref`.
- Localize:
  - CTA labels.
  - Toasts and validation text.
  - Placeholders and `aria-*` labels.

### Workstream C: RTL Hardening
Deliverables:
- Replace directional assumptions (`left/right`) with logical or `rtl:/ltr:` variants.
- Verify RTL in:
  - Cards and forms.
  - Tables and action columns.
  - Carousels/sliders/tabs.
  - Breadcrumb and chevron direction.

### Workstream D: QA and Automation
Deliverables:
- Route-level localization checklist in PR template.
- Command gates in CI/local checks.
- Playwright Arabic smoke suite for core journeys.

## 7) Phased Plan

## Phase 0: Preparation (1-2 days)
Tasks:
- Freeze key naming policy.
- Create `docs/I18N-KEY-MAP.md`.
- Create `docs/I18N-GLOSSARY-AR.md`.
- Create route migration tracker table.
- Define PR checklist for localization.

Exit gate:
- Architecture docs merged.
- Glossary approved by product/content owner.

## Phase 1: Public + Auth Completion (3-5 days)
Priority routes:
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(auth)/verify-email/page.tsx`
- `app/(landing)/explore/page.tsx`
- `app/(landing)/community/[slug]/page.tsx`
- `app/(landing)/community/[slug]/checkout/page.tsx`
- `app/(landing)/faq/page.tsx`
- `app/(landing)/blogs/page.tsx`
- `app/(landing)/blogs/[id]/page.tsx`
- `app/(landing)/invite/[inviteCode]/page.tsx`
- `app/(landing)/profile/page.tsx`
- `app/(landing)/profile/[slug]/page.tsx`
- `app/(landing)/profile/[slug]/edit/page.tsx`
- `app/(landing)/settings/page.tsx`

Exit gate:
- Arabic user can complete: explore -> auth -> community -> checkout -> profile/settings.
- No blocking untranslated strings in these flows.

## Phase 2: Creator Console (5-8 days)
Scope:
- All `app/(creator)/creator/**/page.tsx` (32 pages).

Priority sequence:
1. Dashboard, navigation, notifications.
2. Communities create/customize.
3. Courses/challenges/products/events/sessions CRUD.
4. Monetization and payouts.
5. Marketing and integrations.

Exit gate:
- Creator can onboard and publish content fully in Arabic.

## Phase 3: Community Experience (4-6 days)
Scope:
- All `app/(community)/**/page.tsx`.
- `app/community/[slug]/progress/page.tsx`.

Exit gate:
- Member-facing pages are fully usable in Arabic with stable RTL.

## Phase 4: Admin Backoffice Completion (4-6 days)
Scope focus:
- Communities list/details.
- Content moderation list/details.
- Security/events.
- Communication pages.
- Users pages.
- Settings.
- Verify-2FA / alternate admin login paths.

Exit gate:
- Admin moderation/operations are unambiguous and fully localized in Arabic.

## Phase 5: SEO + Metadata Localization (2 days)
Tasks:
- Localize metadata (`title`, `description`) for Arabic routes.
- Ensure proper Arabic OG/Twitter metadata where route-specific.
- Validate canonical + `hreflang` (`en`, `ar`, `x-default`).

Exit gate:
- SEO metadata is correct for Arabic and does not regress English indexing.

## Phase 6: Final QA + Launch (2-3 days)
Tasks:
- Native Arabic linguistic review.
- Cross-device RTL visual review.
- Accessibility pass for Arabic UI.
- Full hardcoded sweep and smoke tests.

Exit gate:
- Release candidate signed off by engineering + product + QA.

## 8) Route Migration Tracker Template

| Route | Namespace(s) | Keys Added | RTL Reviewed | A11y Reviewed | QA Status | Owner |
|---|---|---:|---|---|---|---|
| `app/(auth)/forgot-password/page.tsx` | `auth.forgotPassword` | 0 | No | No | Todo |  |
| `app/(landing)/explore/page.tsx` | `landing.explore` | 0 | No | No | Todo |  |
| `app/(creator)/creator/dashboard/page.tsx` | `creator.dashboard` | 0 | No | No | Todo |  |

## 9) PR Checklist (Mandatory)
- Route strings migrated to translation keys.
- `messages/en.json` and `messages/ar.json` updated together.
- `npm run i18n:check:parity` passes.
- Hardcoded scan executed for touched domain.
- RTL screenshot/video evidence attached for changed UI.
- Arabic toasts/errors/placeholders verified.
- Locale-safe links verified.

## 10) QA Checklist (Arabic)
- Language switch preserves route context.
- Layout mirrors correctly in RTL.
- Numbers, currency, and dates are readable in Arabic context.
- Truncation/overflow issues resolved for longer Arabic strings.
- Keyboard navigation and screen-reader labels remain valid.
- No unreadable mixed-language critical actions.

## 11) Command Runbook

### Core checks
```bash
npm run i18n:check:parity
node scripts/i18n/find-hardcoded.mjs 'app/(auth)'
node scripts/i18n/find-hardcoded.mjs 'app/(landing)'
node scripts/i18n/find-hardcoded.mjs 'app/(creator)'
node scripts/i18n/find-hardcoded.mjs 'app/(community)'
node scripts/i18n/find-hardcoded.mjs 'app/(admin)'
npm run lint
```

### Optional key seeding
```bash
npm run i18n:translate:ar
```

## 12) Risks and Mitigations
- Inconsistent product terminology across pages.
  - Mitigation: enforce `I18N-GLOSSARY-AR.md` in review.
- RTL regressions in complex dashboards.
  - Mitigation: phase-specific RTL visual QA and screenshots per PR.
- Hidden hardcoded text in shared components/modals.
  - Mitigation: include `components/**` scan before phase sign-off.
- Over-reliance on runtime auto-translation.
  - Mitigation: treat auto-translate as fallback only; remove dependency before final launch.

## 13) Ownership and Cadence
- Engineering lead: migration sequencing, technical quality gates.
- Product/content owner: Arabic tone, glossary, semantic approval.
- QA owner: Arabic functional + RTL + accessibility sign-off.

Cadence:
- Daily status update by phase.
- End-of-phase demo on Arabic routes only.

## 14) Immediate 72-Hour Action Plan
1. Create `I18N-KEY-MAP.md` and `I18N-GLOSSARY-AR.md`.
2. Complete all three remaining auth pages.
3. Complete `landing/explore` + `landing/community/[slug]` + checkout.
4. Add initial Playwright Arabic smoke tests for auth and explore/community entry.
5. Produce first QA evidence pack (RTL screenshots + checklist).

