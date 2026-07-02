# Data retention policy

| Data type | Retention | Mechanism |
|-----------|-----------|-----------|
| MongoDB backups | 14 days default (`RETENTION_DAYS`) | `scripts/backup-mongo.sh` + pre-deploy backup in `deploy.sh` |
| Payment audit logs | 7 years (finance compliance) | `payment_audit_logs` collection — no auto-purge yet |
| Admin audit logs | 365 days | `AdminAuditConfig.RETENTION_DAYS` |
| Revoked JWT tokens | Until natural JWT expiry | TTL index on `revokedtokens.expiresAt` |
| Verification codes (OTP/2FA) | 1 hour after expiry | TTL index on `verificationcodes.expiresAt` |
| Application structured logs | 30–90 days | Container log rotation (`max-size` / `max-file` in compose) |
| User account deletion | Hard delete with cascade | `DELETE /user/delete-account` — orders removed; align with finance policy |
| Media uploads | Until creator deletes or account deletion | MinIO/S3 + local `uploads/` |

## GDPR

- **Export:** `GET /api/user/export-data` (authenticated) — JSON bundle of profile, commerce, learning, communication.
- **Delete:** `DELETE /api/user/delete-account` with password + `confirmText: DELETE`.
- **Cookie consent:** Analytics gated via `cookie-consent-provider`; essential auth cookies documented in privacy policy.

## Review

Review this policy quarterly and after major feature launches. Update `frontend/app/(landing)/privacy-policy/page.tsx` when retention periods change.
