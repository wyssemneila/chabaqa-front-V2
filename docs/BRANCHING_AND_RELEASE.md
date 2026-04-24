# Branching and Release Strategy

## Branch model

- `main`: production-ready code only. Every push to `main` triggers deployment to VPS.
- `develop`: integration branch for upcoming release work.
- `feature/*`: short-lived branches for new features.
- `fix/*`: non-urgent bug fixes.
- `hotfix/*`: urgent production fixes cut from `main`.
- `release/*`: optional stabilization branch before promoting to `main`.

## Pull request flow

1. Branch from `develop` for normal work (`feature/*`, `fix/*`).
2. Open PR into `develop`.
3. CI must pass.
4. Merge `develop` into `main` when release is approved.
5. Push/merge to `main` triggers production deploy workflow.

For urgent incidents:

1. Create `hotfix/*` from `main`.
2. PR to `main`.
3. CI + review.
4. Merge to `main` (auto deploy).
5. Back-merge hotfix into `develop`.

## Recommended GitHub protections

Apply these settings in GitHub repository settings:

### `main`

- Require pull request before merging
- Require at least 1 approval
- Require status checks before merging:
  - `Frontend - Lint, Test, Build`
  - `Backend - Lint, Test, Build`
  - `Docker Compose Validation`
- Require branches to be up to date
- Restrict direct pushes (admins optional)
- Require conversation resolution before merge

### `develop`

- Require pull request before merging
- Require status checks before merging
- Allow maintainers to push if needed

## Tagging and release notes

- Tag production releases from `main` with semantic tags: `vMAJOR.MINOR.PATCH`.
- Example: `v1.4.2`
- Use GitHub Release notes per tag to document:
  - user-visible changes
  - migrations
  - rollback notes
