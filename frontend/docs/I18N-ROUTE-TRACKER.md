# I18N Route Migration Tracker

## Legend
- `Todo`: Not started.
- `In Progress`: Key migration underway.
- `Done`: Strings migrated + parity/lint passed + RTL reviewed.

## Phase 1: Public + Auth

| Route | Namespace(s) | Status | Notes |
|---|---|---|---|
| `app/(auth)/forgot-password/page.tsx` | `auth.forgotPasswordPage`, `auth.forgotPasswordForm` | Done | Localized page + form + links |
| `app/(auth)/reset-password/page.tsx` | `auth.resetPasswordPage`, `auth.resetPasswordForm` | Done | Localized page + form + links |
| `app/(auth)/verify-email/page.tsx` | `auth.verifyEmailPage`, `auth.verifyEmailForm` | Done | Localized page + form + links |
| `app/(landing)/explore/page.tsx` | `landing.explore` | Todo | Keep metadata + page copy localized |
| `app/(landing)/community/[slug]/page.tsx` | `landing.communityDetails.*` | Todo | Includes posts empty states and overview text |
| `app/(landing)/community/[slug]/checkout/page.tsx` | `landing.checkout.*` | Todo | Includes form CTA/messages |
| `app/(landing)/faq/page.tsx` | `landing.faq` | Todo | Check any hardcoded page-level strings |
| `app/(landing)/blogs/page.tsx` | `landing.blog.*` | Todo | |
| `app/(landing)/blogs/[id]/page.tsx` | `landing.blog.*` | Todo | |
| `app/(landing)/invite/[inviteCode]/page.tsx` | `landing.invite.*` | Todo | |
| `app/(landing)/profile/page.tsx` | `landing.profile.*` | Todo | |
| `app/(landing)/profile/[slug]/page.tsx` | `landing.profile.*` | Todo | |
| `app/(landing)/profile/[slug]/edit/page.tsx` | `landing.profile.*` | Todo | |
| `app/(landing)/settings/page.tsx` | `landing.settings.*` | Todo | |

## Phase 2: Creator
- Track all `app/(creator)/creator/**/page.tsx` routes here once migration starts.

## Phase 3: Community
- Track all `app/(community)/**/page.tsx` and `app/community/[slug]/progress/page.tsx`.

## Phase 4: Admin
- Track all remaining `app/(admin)/**/page.tsx` routes.
