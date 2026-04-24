# Frontend

This folder contains the Chabaqa frontend application.

It is a `Next.js` app that serves:

- the public marketing site
- authentication flows
- creator dashboards
- community member experiences
- admin-facing UI sections

## Stack

- Next.js 15
- React 19
- TypeScript
- next-intl
- TanStack Query
- Tailwind CSS
- Jest
- Playwright

## Main Responsibilities

- Render SEO-focused public pages
- Handle authenticated product UI for creators and members
- Integrate with the backend API through typed client wrappers
- Manage localization and direction switching
- Proxy and route API traffic in production-style setups

## Important Folders

```text
frontend/
|- app/            App Router pages and route groups
|- components/     Reusable UI and feature components
|- hooks/          Client hooks
|- lib/            API clients, utilities, auth helpers, shared logic
|- i18n/           Localization request/config wiring
|- messages/       Translation messages
|- public/         Static assets
|- e2e/            Playwright tests
|- __tests__/      Jest tests
|- scripts/        Frontend-specific helper scripts
```

## Route Grouping

The app uses route groups to separate concerns:

- `(landing)` for the public site and SEO pages
- `(auth)` for signin, signup, and recovery flows
- `(creator)` for creator operations
- `(community)` for member/community experiences
- `(dashboard)` for shared dashboard-like flows
- `(admin)` for internal admin interfaces

## API Integration

Frontend API access is mostly centralized under `lib/api/`.

Runtime behavior follows this pattern:

- server-side requests prefer `API_INTERNAL_URL`
- browser-side requests use `NEXT_PUBLIC_API_URL` or `/api`
- `next.config.mjs` rewrites `/api/:path*` to the backend origin

This lets the same app work in both direct local development and containerized deployment.

## Common Commands

From the repository root:

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run start
npm --prefix frontend run test
npm --prefix frontend run test:e2e
```

## Environment Variables

Typical variables used by the frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:8080
API_INTERNAL_URL=http://localhost:3000/api
```

Adjust the values for your environment.

## Build Notes

`next.config.mjs` currently has:

- `eslint.ignoreDuringBuilds = true`
- `typescript.ignoreBuildErrors = true`

That means a successful production build does not guarantee the codebase is free of lint or type issues.

## Related Documents In This Folder

This folder already includes additional implementation and project notes such as:

- `CODEBASE_GUIDE.md`
- `FRONTEND_STRUCTURE.md`
- `QUICK_START.md`
- `DEPLOY.md`

Use this README for orientation and those files for deeper app-specific guidance.
