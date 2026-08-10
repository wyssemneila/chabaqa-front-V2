# Native OpenWA Campaign Gateway

Chabaqa's creator WhatsApp campaign backend targets the maintained
`rmyndharis/OpenWA` multi-session REST gateway. It uses the gateway's documented
`/api/sessions`, QR, pairing-code, webhook, and message-send endpoints.

OpenWA is an unofficial WhatsApp gateway. Only use dedicated sender numbers and
explicitly opted-in recipients. Keep official Meta Cloud API as the preferred
path for regulated, auth-critical, or high-volume messaging.

## Native installation

Run this on the VPS, not in the Chabaqa repository:

```bash
sudo useradd --system --home /opt/openwa --shell /usr/sbin/nologin openwa
sudo install -d -o openwa -g openwa /opt/openwa/data
sudo git clone --depth 1 https://github.com/rmyndharis/OpenWA.git /opt/openwa/current
sudo chown -R openwa:openwa /opt/openwa/current
sudo -u openwa /home/ubuntu/.local/node-v22.19.0-linux-x64/bin/npm ci --prefix /opt/openwa/current
sudo -u openwa /home/ubuntu/.local/node-v22.19.0-linux-x64/bin/npm run build:all --prefix /opt/openwa/current
sudo install -m 0640 -o root -g openwa deploy/openwa/openwa.env.example /etc/chabaqa/openwa.env
sudo install -m 0644 deploy/systemd/chabaqa-openwa.service /etc/systemd/system/chabaqa-openwa.service
sudo systemctl daemon-reload
sudo systemctl enable --now chabaqa-openwa
```

Record the cloned OpenWA commit in the deployment ticket before enabling it.
Generate unique values for `API_MASTER_KEY` and `API_KEY_PEPPER` in
`/etc/chabaqa/openwa.env`. After first boot, use the OpenWA dashboard or its
initial admin key to mint a dedicated scoped operator key for Chabaqa. Put that
key in `/etc/chabaqa/backend.env` as `OPENWA_API_KEY`.

Set the Chabaqa backend values:

```dotenv
WHATSAPP_ENABLED=true
OPENWA_BASE_URL=http://127.0.0.1:2785/api
OPENWA_API_KEY=
OPENWA_WEBHOOK_SECRET=
OPENWA_WEBHOOK_URL=https://chabaqa.io/api/whatsapp/openwa/webhook
WHATSAPP_DAILY_SESSION_SEND_LIMIT=200
WHATSAPP_SEND_INTERVAL_MS=1500
WHATSAPP_APPEND_OPT_OUT_FOOTER=true
```

Restart `chabaqa-openwa`, then `chabaqa-backend`. The OpenWA port must remain
bound to localhost; do not expose it through Nginx or Cloudflare.

## Creator acceptance test

1. Open Creator Dashboard -> WhatsApp and select a sandbox community.
2. Connect a dedicated sandbox number with QR or pairing code.
3. Confirm the session reaches `ready` and send a test message to an opted-in
   team number.
4. Import one opted-in contact with consent proof.
5. Create a one-recipient campaign and send it.
6. Confirm the campaign recipient receives an OpenWA message ID and delivery
   updates arrive through the signed webhook.
7. Reply `STOP` and confirm pending campaign recipients are skipped.

Never send campaigns until the connection, test message, consent capture, and
webhook status test have passed.
