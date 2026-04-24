# I18N PR Checklist

Use this checklist in every localization PR.

## Key and Copy
- [ ] All new user-facing strings are moved to translation keys.
- [ ] `messages/en.json` and `messages/ar.json` updated in the same PR.
- [ ] Keys follow `domain.page.section.element` naming.
- [ ] Arabic wording follows `docs/I18N-GLOSSARY-AR.md`.

## Routing and Locale
- [ ] Locale-safe links use `localizeHref` where applicable.
- [ ] `/ar` route behavior verified for changed screens.
- [ ] No locale regression on `/en` routes.

## RTL and UX
- [ ] RTL layout checked for changed components.
- [ ] Directional icons/chevrons are correct in RTL.
- [ ] Overflow/truncation checked with Arabic copy.

## Validation and Feedback
- [ ] Form labels/placeholders localized.
- [ ] Toasts/errors/success messages localized.
- [ ] `aria-*` labels and helper text localized when user-facing.

## Quality Gates
- [ ] `npm run i18n:check:parity` passes.
- [ ] Hardcoded scan run for touched area (`scripts/i18n/find-hardcoded.mjs`).
- [ ] `npm run lint` passes for touched files.
- [ ] E2E smoke tests updated for impacted Arabic flows.

## Evidence
- [ ] Before/after screenshots attached (desktop + mobile where applicable).
- [ ] Notes mention any intentionally non-localized technical strings.
