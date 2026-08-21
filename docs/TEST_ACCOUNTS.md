# Test / Demo Accounts

Seeded by `cd backend && npm run db:seed:platform-demo` (runs `scripts/seed-platform-demo.js`).
All seeded accounts share the password below unless noted otherwise.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin.demo@chabaqa.demo` | `Demo123456!` | Full admin dashboard access |
| Creator | `amina.creator@chabaqa.demo` | `Demo123456!` | Product education community |
| Creator | `youssef.creator@chabaqa.demo` | `Demo123456!` | Challenges / motion design |
| Creator | `meriem.creator@chabaqa.demo` | `Demo123456!` | Data/ops mentorship |
| Creator | `hela.creator@chabaqa.demo` | `Demo123456!` | Wellness coaching |
| Creator | `tarek.creator@chabaqa.demo` | `Demo123456!` | Automation consulting |
| Member | `sarra.member@chabaqa.demo` … `aya.member@chabaqa.demo` | `Demo123456!` | ~12 member accounts across communities |

Run additional seeds as needed:

```bash
cd backend
npm run db:seed:platform-demo # destructive local-only replacement: full platform demo dataset
npm run db:seed               # alias for the same destructive local-only seed
```

> Seeding is idempotent (upserts by email/slug) — safe to re-run against the same database.

## Resetting demo data

```bash
npm run db:wipe:dry   # preview what would be deleted
npm run db:wipe        # destructive — local/dev only, gated by ALLOW_ADMIN_DB_CLEANUP
```

Never run `db:wipe` against a production database. `ALLOW_ADMIN_DB_CLEANUP=false` in
`docker-compose.yml` and production `.env` blocks this by default.
