# I18N Key Map

## Purpose
Canonical namespace map for all translation keys used in the frontend. This file defines ownership and expected scope for each namespace.

## Naming Standard
- Format: `domain.page.section.element`
- Example: `creator.dashboard.cards.totalRevenue.label`

## Top-Level Domains
- `common`
- `auth`
- `landing`
- `community`
- `creator`
- `admin`
- `forms`
- `errors`
- `validation`
- `seo`

## Namespace Inventory

## `common`
- Scope: Global/shared UI labels used across multiple route groups.
- Examples:
  - `common.brand`
  - `common.language`
  - `common.loading`

## `auth`
- Scope: Authentication pages and auth form components.
- Active namespaces:
  - `auth.signinPage`
  - `auth.signupPage`
  - `auth.signinForm`
  - `auth.signupForm`
  - `auth.forgotPasswordPage`
  - `auth.forgotPasswordForm`
  - `auth.resetPasswordPage`
  - `auth.resetPasswordForm`
  - `auth.verifyEmailPage`
  - `auth.verifyEmailForm`
- Notes:
  - Keep validation fallbacks in `auth.*.errors.*` when tied to a specific flow.

## `landing`
- Scope: Public landing and discovery surfaces.
- Active namespaces include:
  - `landing.header`
  - `landing.footer`
  - `landing.hero`
  - `landing.about`
  - `landing.features`
  - `landing.howItWorks`
  - `landing.pricing`
  - `landing.videos`
  - `landing.faq`
  - `landing.explore`
- Planned additions:
  - `landing.communityDetails.*`
  - `landing.checkout.*`
  - `landing.blog.*`
  - `landing.profile.*`
  - `landing.settings.*`

## `community`
- Scope: Logged-user community experience pages and reusable community UI.
- Existing footprint is minimal and must be expanded in migration.
- Planned baseline namespaces:
  - `community.home`
  - `community.members`
  - `community.progress`
  - `community.reviews`
  - `community.products`
  - `community.courses`
  - `community.challenges`
  - `community.sessions`
  - `community.events`

## `creator`
- Scope: Creator console routes and widgets.
- Existing footprint is minimal and must be expanded in migration.
- Planned baseline namespaces:
  - `creator.dashboard`
  - `creator.communities`
  - `creator.customize`
  - `creator.courses`
  - `creator.challenges`
  - `creator.products`
  - `creator.events`
  - `creator.sessions`
  - `creator.analytics`
  - `creator.notifications`
  - `creator.marketing`
  - `creator.monetization`

## `admin`
- Scope: Admin dashboard and backoffice modules.
- Existing namespaces:
  - `admin`
  - `admin.header`
  - `admin.login`
  - `admin.dashboard`
- Planned additions:
  - `admin.communities.*`
  - `admin.contentModeration.*`
  - `admin.communication.*`
  - `admin.users.*`
  - `admin.settings.*`
  - `admin.security.*`

## `forms`
- Scope: Generic reusable form labels/help text not tied to a single feature.

## `errors`
- Scope: Generic app-level error labels/messages.

## `validation`
- Scope: Generic validation message keys (not feature-specific).

## `seo`
- Scope: Localized metadata snippets and SEO-related labels.

## Ownership Rules
- Every PR adding UI copy must add/update both:
  - `messages/en.json`
  - `messages/ar.json`
- Feature owner is responsible for namespace consistency in their route group.

## Review Rules
- No new hardcoded user-facing literal in migrated files.
- New keys must follow namespace ownership in this map.
- Parity check must pass before merge.
