# Backend

This folder contains the Chabaqa backend application.

It is a `NestJS` API that handles authentication, business logic, data access, payments, uploads, analytics, notifications, and admin operations.

## Stack

- NestJS 11
- TypeScript
- MongoDB with Mongoose
- Redis
- Swagger
- Jest

## Main Responsibilities

- Expose the platform API under `/api`
- Handle authentication and authorization
- Manage communities, courses, challenges, products, sessions, events, and enrollments
- Process payments and payouts
- Serve uploads and media-related workflows
- Support analytics, email campaigns, and notifications
- Provide admin and moderation endpoints

## Important Folders

```text
backend/
|- src/            Application source code
|- scripts/        Maintenance and data backfill scripts
|- uploads/        Runtime upload storage
|- hls-output/     Runtime HLS video output
|- public/         Static public assets
```

Within `src/`, major feature modules include:

- `auth/`
- `communities/`
- `cours/`
- `challenge/`
- `event/`
- `product/`
- `session/`
- `analytics/`
- `email-campaign/`
- `affiliate/`
- `notification/`
- `admin/`
- `upload/`
- `video/`
- `community-access/`

## Application Behavior

Key runtime characteristics from the current backend setup:

- Global API prefix: `/api`
- Validation is enforced using Nest global validation pipes
- CORS is controlled by allowlist configuration
- Static uploads are served under `/uploads`
- Monitoring and request logging are enabled
- Swagger can be enabled depending on environment settings

## Common Commands

From the repository root:

```bash
npm --prefix backend ci
npm --prefix backend run start:dev
npm --prefix backend run build
npm --prefix backend run start:prod
npm --prefix backend run test
npm --prefix backend run test:e2e
```

## Local Data And Utility Commands

Useful scripts defined in `package.json` include:

- `db:inspect`
- `db:wipe:dry`
- `db:wipe`
- `db:seed`
- `audit:media`
- various `backfill:*` scripts

Review each script before running it against shared or production-like data.

## Environment Variables

Common categories of backend configuration include:

- server port and host
- MongoDB connection
- Redis connection
- email delivery settings
- OAuth configuration
- payment provider credentials
- CORS and security settings
- upload and media configuration

Do not commit secrets.

## Uploads And Media

The backend handles multiple asset types, including images, documents, audio, and video-related flows.

Important related paths:

- `uploads/`
- `hls-output/`
- `src/upload/`
- `src/video/`

## Email Campaign Delivery Checklist

Use this checklist when campaign emails fail with SMTP auth errors such as `535-5.7.8 BadCredentials`.

1. Verify SMTP environment variables are set in deployment env.
2. Confirm `EMAIL_USER` and `EMAIL_PASSWORD` are correct.
3. For Gmail, use an app password with 2FA enabled.
4. Keep `EMAIL_ALLOW_ETHEREAL_FALLBACK=false` in production unless fallback is intentional.
5. Redeploy the backend after environment changes.

## Deployment Note

Production-style deployment in this repository can run through Docker Compose or PM2-based workflows.

Related files:

- `Dockerfile`
- `Dockerfile.prod`
- `../docker-compose.yml`
- `../ecosystem.config.cjs`
- `../deploy.sh`
- `../deploy-pm2.sh`

## Additional Documents In This Folder

This folder also contains targeted backend documents such as:

- `PRODUCTION.md`
- `CREDENTIALS.md`

Use this README for orientation and those files for deeper operational detail.
