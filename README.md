# Chabaqa

Chabaqa is an all-in-one creator and community platform. It combines a public marketing site, creator workspace, member community experience, payments, content delivery, messaging, analytics, and operational tooling in a single repository.

This repository contains:

- A `Next.js` frontend for the public site, creator dashboard, and community product UI.
- A `NestJS` backend for authentication, business logic, media delivery, payments, analytics, and admin operations.
- Deployment and infrastructure configuration for Docker Compose, PM2, and Nginx.

## Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- next-intl
- TanStack Query
- Jest
- Playwright
- Tailwind CSS

### Backend

- NestJS 11
- TypeScript
- MongoDB with Mongoose
- Redis
- Swagger
- Jest

### Operations

- Docker Compose
- PM2
- Nginx
- GitHub Actions

## Product Areas

The platform includes these major areas:

- Public landing pages and SEO content
- Authentication and account management
- Community creation and customization
- Courses and learning paths
- Challenges and achievements
- Events and sessions
- Digital products and subscriptions
- Community posts and messaging
- Creator analytics and insights
- Email campaigns and notifications
- Affiliate workflows
- Admin and moderation tooling

## Repository Layout

```text
.
|- frontend/         Next.js application
|- backend/          NestJS API and services
|- docs/             Deployment and operations documentation
|- nginx/            Nginx site configuration
|- scripts/          Repository helper scripts
|- .github/          GitHub workflows and templates
|- docker-compose.yml
|- ecosystem.config.cjs
|- deploy.sh
|- deploy-pm2.sh
```

See the README inside each top-level folder for local details.

## Architecture Overview

### Frontend

The frontend is a single Next.js application that serves several experiences:

- Public marketing pages under route groups such as `(landing)`
- Authentication flows under `(auth)`
- Creator-facing management screens under `(creator)`
- Community/member-facing product screens under `(community)`
- Admin-oriented areas under `(admin)`

API access is primarily handled through typed client wrappers under `frontend/lib/api/`.

### Backend

The backend is a modular NestJS application with feature modules for:

- Auth
- Communities
- Courses
- Challenges
- Events
- Products
- Sessions
- Notifications
- Analytics
- Media and uploads
- Email campaigns
- Affiliates
- Admin operations

The application exposes its API under the global `/api` prefix.

## Runtime Ports

- Frontend: `8081` in production-style runs, `8080` in local frontend dev mode
- Backend: `3000`
- MongoDB: `27017`
- Redis: `6379`

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm
- Docker and Docker Compose for local MongoDB and Redis

### 1. Start infrastructure

From the repository root:

```bash
docker compose up -d mongo redis
```

### 2. Install dependencies

```bash
npm --prefix backend ci
npm --prefix frontend ci
```

### 3. Start the backend

```bash
npm --prefix backend run start:dev
```

If you want the local database helper wrapper:

```bash
npm --prefix backend run start:dev:localdb
```

### 4. Start the frontend

```bash
npm --prefix frontend run dev
```

## Environment Notes

This repository uses environment files for both apps. Do not commit secrets.

Common runtime variables include:

- Frontend:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `API_INTERNAL_URL`
- Backend:
  - `PORT`
  - `MONGO_URI`
  - Redis and payment configuration
  - Email and OAuth configuration
  - CORS and security settings

The frontend is designed to use:

- `API_INTERNAL_URL` for server-side container-to-container calls
- `NEXT_PUBLIC_API_URL` for browser-facing calls

## Core Commands

### Frontend

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run start
npm --prefix frontend run test
npm --prefix frontend run test:e2e
```

### Backend

```bash
npm --prefix backend run start:dev
npm --prefix backend run build
npm --prefix backend run start:prod
npm --prefix backend run test
npm --prefix backend run test:e2e
```

## Deployment

Two main deployment paths exist in this repository:

### Docker Compose deployment

Use the root `deploy.sh` script. It:

- syncs the target branch
- validates Compose configuration
- rebuilds services
- recreates containers
- runs basic health checks

### PM2 deployment

Use `deploy-pm2.sh`. It:

- installs dependencies
- builds backend and frontend
- prepares Next standalone assets
- reloads PM2 apps using `ecosystem.config.cjs`
- optionally reloads Nginx if run with sufficient privileges

Additional operational guides are in `docs/`.

## CI/CD

GitHub Actions live in `.github/workflows/`.

Current automation covers:

- CI checks
- production deployment workflow

## Documentation Strategy

This repository now keeps documentation at two levels:

- Root README: high-level orientation for GitHub visitors and new contributors
- Folder READMEs: focused details for each major area

If you add a new top-level subsystem, add or update its folder README in the same change.

## Important Notes For Contributors

- The repo may be actively used with uncommitted local changes; avoid destructive git operations.
- Some app configuration is deployment-specific, especially around uploads, API routing, and Nginx.
- The frontend build is currently configured to ignore TypeScript and ESLint build errors, so do not assume a successful build means the codebase is clean.

## Top-Level READMEs

- `backend/README.md`
- `frontend/README.md`
- `docs/README.md`
- `nginx/README.md`
- `scripts/README.md`
- `.github/README.md`
