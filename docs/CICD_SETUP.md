# CI/CD Setup (GitHub Actions + VPS Docker Deploy)

This repository now includes monorepo-level CI/CD workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-production.yml`

## What happens automatically

- PRs and pushes to `main`/`develop` run CI:
  - frontend lint, test, build
  - backend lint, test, build
  - `docker compose config` validation
- Pushes to `main` trigger production deployment via SSH to the VPS.
- Deployment pulls latest `main`, rebuilds images, recreates services, and verifies health.

## Required GitHub Secrets

Set these repository secrets in GitHub Settings -> Secrets and variables -> Actions:

- `VPS_HOST`: VPS public IP or hostname
- `VPS_USER`: SSH user (recommended `ubuntu`)
- `VPS_PORT`: usually `22`
- `VPS_SSH_PRIVATE_KEY`: private key matching authorized key on VPS
- `VPS_PROJECT_DIR`: `/home/ubuntu/chabaqa` (or your actual deployment path)

## VPS requirements

- Docker and Docker Compose installed
- Project cloned at `VPS_PROJECT_DIR`
- `.env` files present:
  - `backend/.env`
  - `frontend/.env`
- SSH user can run Docker commands
  - either in docker group, or with sudo rights configured appropriately

## First-time bootstrap checklist

1. Push current repository to GitHub.
2. Add required Action secrets.
3. On VPS, verify manual deploy works:
   - `cd /home/ubuntu/chabaqa`
   - `chmod +x deploy.sh`
   - `./deploy.sh`
4. Create `develop` branch:
   - `bash scripts/git/setup-branches.sh`
5. Apply branch protection (optional but recommended):
   - `bash scripts/git/apply-branch-protection.sh Louay0007/chabaqa`

## Rollback

If a deployment fails, rollback on VPS:

```bash
cd /home/ubuntu/chabaqa
git log --oneline -n 5
git reset --hard <previous_commit_sha>
docker compose up -d --force-recreate
```
