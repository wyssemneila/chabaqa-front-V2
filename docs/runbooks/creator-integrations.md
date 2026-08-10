# Runbook: Creator Integrations

## Provider onboarding

Keep every provider credential in `/etc/chabaqa/backend.env`. Never add it to
the frontend environment, Docker compose files, shell history, or git.

### Google Sheets

1. Create a Google Cloud OAuth web application owned by Chabaqa.
2. Enable the Google Sheets API.
3. Register `https://chabaqa.io/api/creator/integrations/oauth/google_sheets/callback`.
4. Set `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, and
   `GOOGLE_SHEETS_REDIRECT_URI` in the backend environment.
5. Restart the backend and connect a sandbox creator to a spreadsheet owned by
   the sandbox Google account.

### Zoom

1. Create a Zoom Marketplace user-level OAuth application owned by Chabaqa.
2. Register `https://chabaqa.io/api/creator/integrations/oauth/zoom/callback`.
3. Request only `user:read:user`, `meeting:read:meeting`, and
   `meeting:write:meeting` while the app is under review.
4. Set `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, and `ZOOM_REDIRECT_URI`.
5. Verify OAuth readiness only. This release does not create meetings or import
   attendance.

### Discord

1. Create a Discord OAuth application and bot owned by Chabaqa.
2. Register `https://chabaqa.io/api/creator/integrations/oauth/discord/callback`.
3. Install the bot in a sandbox guild with only `View Channels` and `Send
   Messages` permissions in its sandbox announcement channel.
4. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and
   `DISCORD_BOT_TOKEN`.
5. Connect the sandbox creator, map the sandbox guild/channel, enable post
   announcements, then send one test post.

### Kit and Brevo

1. Create non-production provider accounts and empty sandbox audiences.
2. Use a sandbox creator API key only. Do not reuse production keys.
3. Map a dedicated test tag/form (Kit) or list (Brevo).
4. Set the policy version and data-processing acknowledgement before enabling
   contact sync.
5. Record a member’s explicit sandbox consent before emitting an event.

## Sandbox data

Use a separate sandbox community and accounts. Do not connect production
members to development or staging providers. The recommended fixture is:

- Community: `Integration Sandbox` with a non-public test slug.
- Creator: a dedicated creator account with no production communities.
- Member: a dedicated member account with a mailbox controlled by the team.
- Spreadsheet, Discord guild, Kit tag/form, and Brevo list: each named
  `Chabaqa Integration Sandbox`.

## Acceptance checklist

Run after adding real provider credentials and after any provider credential
rotation. Capture delivery IDs and provider-side evidence in the release ticket.

1. Google Sheets: OAuth succeeds, connection test passes, `post.created`
   appends one redacted row, and replay does not create a duplicate provider
   action for the same idempotency key.
2. Kit and Brevo: grant member consent, emit a safe lifecycle event, verify the
   sandbox contact/tag/list, revoke consent, emit another event, and verify no
   future contact sync occurs.
3. Zoom: OAuth callback and connection test pass. Confirm no meeting is
   created and no attendance is imported.
4. Discord: OAuth and bot configuration test pass; one `post.created` event
   publishes one sandbox-channel announcement.
5. Zapier, Make, and custom webhooks: validate the HMAC over the raw body,
   preserve `x-chabaqa-event-id` as the idempotency key, return a non-2xx once
   to observe retry/replay, and verify a private-network URL is rejected.

## Consent copy

The following is product copy, not legal advice. Legal counsel must approve the
policy version and any provider-specific data-processing terms before use.

| Locale | Draft explicit opt-in copy |
| --- | --- |
| EN | I agree that this community may share my contact details with the named provider for updates and offers under the stated policy version. I can withdraw consent at any time. |
| FR | J'accepte que cette communaute partage mes coordonnees avec le fournisseur indique pour recevoir des actualites et des offres selon la version de politique indiquee. Je peux retirer mon consentement a tout moment. |
| AR | اوافق على ان يشارك هذا المجتمع بيانات الاتصال الخاصة بي مع المزود المذكور لتلقي التحديثات والعروض وفق إصدار السياسة الموضح. يمكنني سحب موافقتي في أي وقت. |

## Credential rotation

1. Create a new provider credential in the provider console.
2. Update `/etc/chabaqa/backend.env` with `sudoedit`; keep the previous value
   only until the new connection test succeeds.
3. Restart `chabaqa-backend`, verify `/api/health/ping`, then test the provider
   connection from the creator integrations page.
4. Revoke the old provider credential in its provider console.
5. Review delivery health and Prometheus alerts for 24 hours.

For `INTEGRATIONS_ENCRYPTION_KEY`, do not rotate in place. It encrypts stored
provider credentials. Perform a planned decrypt-and-reencrypt migration or have
creators reconnect after an approved outage window.
