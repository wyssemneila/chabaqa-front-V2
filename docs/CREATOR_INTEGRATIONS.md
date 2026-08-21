# Creator integrations

The creator integrations service is deliberately designed so an external
provider outage never blocks a payment, membership update, booking, or content
write. Lifecycle actions are persisted first; provider work is placed in a
durable, idempotent outbox and retried up to five times.

## Server configuration

Set these values in the backend service environment, never in the frontend:

```dotenv
# Generate with: openssl rand -base64 32
INTEGRATIONS_ENCRYPTION_KEY=
INTEGRATIONS_OAUTH_CALLBACK_BASE_URL=https://chabaqa.io/api/creator/integrations/oauth

GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
GOOGLE_SHEETS_REDIRECT_URI=https://chabaqa.io/api/creator/integrations/oauth/google_sheets/callback

ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=https://chabaqa.io/api/creator/integrations/oauth/zoom/callback

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://chabaqa.io/api/creator/integrations/oauth/discord/callback
DISCORD_BOT_TOKEN=
```

`INTEGRATIONS_ENCRYPTION_KEY` is separate from the JWT key. Rotate it only with
a planned credential re-encryption migration; changing it makes previously
stored third-party credentials unreadable.

## Connector behavior

| Connector | Connection | Production behavior |
| --- | --- | --- |
| Google Sheets | OAuth authorization-code flow with PKCE | Appends configured lifecycle rows to the selected spreadsheet. |
| Kit | Creator-scoped API key | Creates/updates contacts, then applies mapped tags/forms only when the member has current explicit consent. |
| Brevo | Creator-scoped API key | Creates/updates consented contacts in mapped lists only. |
| Zoom | Marketplace user OAuth | Secure connection/readiness only. Chabaqa does not create Zoom meetings or import attendance in this release. |
| Discord | Creator OAuth plus server-held bot | Verifies creator OAuth; post announcements can be sent to the selected channel after the bot is installed. Role sync is unavailable until members have verified Discord identity links and role hierarchy validation. |

Creator-provided API keys and OAuth tokens are AES-256-GCM encrypted at rest,
excluded from query results, and removed on disconnect. The UI never stores
them in browser storage or URL parameters.

## Marketing consent

Kit and Brevo contact sync requires both:

1. A creator mapping that records its privacy-policy version and a
   data-processing acknowledgement.
2. A member-level consent record for the exact community and provider.

The authenticated member API is:

```text
POST /api/creator/integrations/contact-consent
{
  "provider": "kit" | "brevo",
  "communityId": "…",
  "policyVersion": "2026-08",
  "granted": true | false
}
```

Revoking consent prevents future contact synchronization. Existing external
contacts are not silently deleted or unsubscribed. This release uses a
suppression-only policy until each creator and legal owner chooses and documents
an external deletion or unsubscribe policy.

Members manage active connector consent from **Settings → Marketing**. The page
only shows connected Kit or Brevo mappings for communities where the member is
currently enrolled, identifies the policy version, and records each decision
against the exact community and provider.

Checkout shows the same optional, unchecked choice only when the community has
an active Kit or Brevo mapping. The member must be authenticated; the recorded
consent is still scoped to the exact community, provider, and policy version.

## Product boundaries

- **Zoom:** connection verification only; meeting creation and attendance import
  are not configured or dispatched.
- **Discord:** post announcements only; role IDs and role synchronization are
  rejected until identity linking and role hierarchy enforcement exist.
- **Partial refunds:** preserve the existing entitlement and do not emit
  `purchase.refunded`. Full refunds revoke entitlement and emit the event. This
  avoids automated access changes before a per-offer partial-refund policy is
  implemented.

## Operations and retention

- Prometheus exports retrying and exhausted integration deliveries plus OAuth
  callback and credential encryption/decryption failure counters. Alertmanager
  alerts on exhausted deliveries and credential failures.
- The service reconciles retrying and exhausted deliveries every ten minutes;
  inspect the creator delivery-health panel, correct the mapping or credential,
  then replay an eligible delivery.
- OAuth state records expire automatically after ten minutes. Delivered and
  skipped delivery rows are retained for 90 days; permanently failed rows are
  retained for 30 days. Revoked API keys and consent records remain until the
  owning account is deleted so their audit history is preserved.
- If `INTEGRATIONS_ENCRYPTION_KEY` is lost or changed, do not reconnect users
  blindly: restore the prior key or execute a credential re-encryption
  migration. Provider credentials can be disconnected and re-authorized only
  after the incident is documented.

## Lifecycle contract

Verified lifecycle events are published through signed webhooks and eligible
native outbox connectors. Payloads intentionally exclude payment credentials,
refund reasons, booking notes, challenge submission content/files/links, and
email addresses.

`challenge.submitted` is the durable event for a challenge task submission.
There is no generic Forms subsystem or canonical generic form write path in
Chabaqa today, so `form.submitted` remains absent rather than exposing an
aspirational or privacy-undefined event.
