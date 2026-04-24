# Nginx

This folder contains Nginx site configuration used to expose Chabaqa in production-style environments.

## Purpose

These configs sit in front of the frontend and backend applications and typically handle:

- domain routing
- TLS termination or upstream coordination
- reverse proxy behavior
- request forwarding to frontend and backend services
- static and upload route handling
- Cloudflare-aware deployment setup

## Files

- `chabaqa-cloudflare.conf`
  - Main site configuration intended for the Chabaqa deployment behind Cloudflare.
- `opencode-web.conf`
  - Additional web/server configuration for the OpenCode-related setup in this repo.

## Related Files Outside This Folder

- `deploy-pm2.sh`
  - Can install and reload the Nginx site config when run with sufficient privileges.
- `backend/nginx.conf.example`
  - Backend-specific example config.
- `frontend/nginx.conf`
  - Frontend-side Nginx-related configuration.
- `docs/CLOUDFLARE_VPS_SETUP.md`
  - Higher-level deployment guide.

## Usage Notes

- Review server names, upstream ports, and file paths before applying configs to a server.
- Validate changes with `nginx -t` before reload.
- Keep repo configs aligned with actual PM2 or Docker runtime ports.

## Typical Runtime Mapping

- Frontend app: `127.0.0.1:8081`
- Backend API: `127.0.0.1:3000`

Adjust if your deployment topology differs.
