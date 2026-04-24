# Chabaqa VPS-to-VPS Migration Guide (SCP + Full Data Parity)

This guide moves `chabaqa` from the current VPS to a new VPS using `scp`, while preserving:

- source code
- runtime config (`.env` files)
- MongoDB data (primary DB)
- Redis data (cache/session layer, optional but recommended)
- uploaded files and Docker named volumes

It is written for this project layout:

- `/home/ubuntu/chabaqa`
- Docker Compose stack with `mongo`, `redis`, `chabaqa-backend`, `chabaqa-frontend`

---

## PM2-Only deployment plan on new VPS (no Docker)

This is the clean execution plan using your real servers:

- old VPS: `ubuntu@51.254.132.77` (password: `chabaqa-2026`)
- new VPS: `root@76.13.57.215` (password: `Chabaqa-2026`)

### A) Set migration variables on your local machine

```bash
export OLD_HOST="51.254.132.77"
export OLD_USER="ubuntu"
export NEW_HOST="76.13.57.215"
export NEW_USER="root"
export APP_USER="ubuntu"
export APP_DIR="/home/ubuntu/chabaqa"
export BACKUP_DIR="/home/ubuntu/chabaqa-migration-backup"
```

Install `sshpass` locally for password-based automation (optional):

```bash
sudo apt update
sudo apt install -y sshpass
```

### B) Prepare the new VPS (as root)

```bash
ssh root@76.13.57.215
```

Create deploy user and grant sudo:

```bash
id -u ubuntu >/dev/null 2>&1 || adduser --disabled-password --gecos "" ubuntu
usermod -aG sudo ubuntu
```

Install base packages:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release git unzip jq htop nginx redis-server ufw
```

Install MongoDB 7:

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
```

Install Node.js 22 + PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs build-essential
npm i -g pm2
```

Enable services:

```bash
systemctl enable mongod redis-server nginx
systemctl start mongod redis-server nginx
```

Firewall:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### C) Copy project with SCP (old -> local -> new)

Copy old VPS project to local machine:

```bash
sshpass -p 'chabaqa-2026' scp -o StrictHostKeyChecking=no -r ubuntu@51.254.132.77:/home/ubuntu/chabaqa /tmp/
```

Copy local project to new VPS:

```bash
sshpass -p 'Chabaqa-2026' scp -o StrictHostKeyChecking=no -r /tmp/chabaqa root@76.13.57.215:/home/ubuntu/
```

Fix ownership on new VPS:

```bash
ssh root@76.13.57.215
chown -R ubuntu:ubuntu /home/ubuntu/chabaqa
chmod 600 /home/ubuntu/chabaqa/backend/.env
chmod 600 /home/ubuntu/chabaqa/frontend/.env
```

### D) Update env for native runtime (important)

Edit `/home/ubuntu/chabaqa/backend/.env`:

- `MONGO_URI=mongodb://127.0.0.1:27017/chabaqa_local`
- `REDIS_HOST=127.0.0.1`
- keep `REDIS_PORT=6379`

Edit `/home/ubuntu/chabaqa/frontend/.env`:

- `API_INTERNAL_URL=http://127.0.0.1:3000/api`
- keep `NEXT_PUBLIC_API_URL=https://chabaqa.io/api`

### E) Build apps on new VPS (as ubuntu)

```bash
su - ubuntu
cd /home/ubuntu/chabaqa/backend
npm ci
npm run build

cd /home/ubuntu/chabaqa/frontend
npm ci
npm run build
```

### F) PM2 ecosystem and startup

Create `/home/ubuntu/chabaqa/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'chabaqa-backend',
      cwd: '/home/ubuntu/chabaqa/backend',
      script: 'dist/main.js',
      interpreter: 'node',
      env_file: '/home/ubuntu/chabaqa/backend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    },
    {
      name: 'chabaqa-frontend',
      cwd: '/home/ubuntu/chabaqa/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 8080',
      interpreter: 'node',
      env_file: '/home/ubuntu/chabaqa/frontend/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        HOSTNAME: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    }
  ]
}
```

Start PM2 apps:

```bash
cd /home/ubuntu/chabaqa
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 status
```

### G) Nginx reverse proxy

Create `/etc/nginx/sites-available/chabaqa`:

```nginx
server {
    listen 80;
    server_name chabaqa.io www.chabaqa.io;

    client_max_body_size 100M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
ln -sf /etc/nginx/sites-available/chabaqa /etc/nginx/sites-enabled/chabaqa
nginx -t
systemctl reload nginx
```

TLS:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d chabaqa.io -d www.chabaqa.io
```

### H) Database migration with parity (old Docker Mongo -> new native Mongo)

On old VPS:

```bash
sshpass -p 'chabaqa-2026' ssh -o StrictHostKeyChecking=no ubuntu@51.254.132.77 '
  mkdir -p /home/ubuntu/chabaqa-migration-backup &&
  cd /home/ubuntu/chabaqa &&
  sudo docker compose stop chabaqa-frontend chabaqa-backend &&
  sudo docker exec chabaqa-mongo sh -c "mongodump --archive=/tmp/chabaqa-mongo.archive --gzip" &&
  sudo docker cp chabaqa-mongo:/tmp/chabaqa-mongo.archive /home/ubuntu/chabaqa-migration-backup/chabaqa-mongo.archive &&
  sudo docker exec chabaqa-redis sh -c "redis-cli -a \"c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9\" SAVE" &&
  sudo docker cp chabaqa-redis:/data/dump.rdb /home/ubuntu/chabaqa-migration-backup/redis-dump.rdb &&
  tar -czf /home/ubuntu/chabaqa-migration-backup/backend-uploads.tar.gz -C /home/ubuntu/chabaqa/backend uploads'
```

Transfer backups:

```bash
sshpass -p 'chabaqa-2026' scp -o StrictHostKeyChecking=no -r ubuntu@51.254.132.77:/home/ubuntu/chabaqa-migration-backup /tmp/
sshpass -p 'Chabaqa-2026' scp -o StrictHostKeyChecking=no -r /tmp/chabaqa-migration-backup root@76.13.57.215:/home/ubuntu/
```

Restore on new VPS:

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/chabaqa_local" --drop --archive=/home/ubuntu/chabaqa-migration-backup/chabaqa-mongo.archive --gzip
systemctl stop redis-server
cp /home/ubuntu/chabaqa-migration-backup/redis-dump.rdb /var/lib/redis/dump.rdb
chown redis:redis /var/lib/redis/dump.rdb
systemctl start redis-server
tar -xzf /home/ubuntu/chabaqa-migration-backup/backend-uploads.tar.gz -C /home/ubuntu/chabaqa/backend
chown -R ubuntu:ubuntu /home/ubuntu/chabaqa/backend/uploads
```

### I) Final verification and cutover

```bash
pm2 status
pm2 logs chabaqa-backend --lines 80
pm2 logs chabaqa-frontend --lines 80
curl -I http://127.0.0.1:3000/api
curl -I http://127.0.0.1:8080
curl -I https://chabaqa.io
curl -I https://chabaqa.io/api
```

Mongo parity check (run on old and new, compare):

```bash
mongosh --quiet --eval '
const d=db.getSiblingDB("chabaqa_local");
d.getCollectionNames().sort().forEach(c=>print(c+":"+d.getCollection(c).countDocuments({})));'
```

After cutover, rotate all secrets and both VPS passwords immediately.

---

## 0) Migration strategy

Use a **short maintenance window** to guarantee identical data:

1. Prepare and install everything on the new VPS.
2. Copy project files from old VPS to new VPS.
3. Stop writes on old VPS (maintenance mode / block app traffic).
4. Create fresh Mongo dump + Redis snapshot on old VPS.
5. Transfer backups with `scp`.
6. Restore on new VPS.
7. Run parity checks (counts + checksums-like sanity checks).
8. Switch DNS / reverse proxy to new VPS.
9. Monitor and keep rollback path ready.

---

## 1) Variables you should set first

On your local machine (or old VPS shell), define:

```bash
export OLD_HOST="old.vps.ip.or.domain"
export NEW_HOST="new.vps.ip.or.domain"
export USER="ubuntu"
export APP_DIR="/home/ubuntu/chabaqa"
export BACKUP_DIR="/home/ubuntu/chabaqa-migration-backup"
```

Optional SSH key path:

```bash
export SSH_KEY="$HOME/.ssh/id_rsa"
```

---

## 2) Pre-checks on old VPS

SSH into old VPS:

```bash
ssh ${USER}@${OLD_HOST}
```

Verify stack health:

```bash
cd /home/ubuntu/chabaqa
sudo docker compose ps
curl -I http://127.0.0.1:3000/api
curl -I http://127.0.0.1:8081/
```

Create backup working directory:

```bash
mkdir -p /home/ubuntu/chabaqa-migration-backup
```

---

## 3) Install everything needed on new VPS

SSH into new VPS:

```bash
ssh ${USER}@${NEW_HOST}
```

Update system and install required tools:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release git unzip jq htop ufw
```

Install Docker Engine + Compose plugin:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Allow current user to run Docker:

```bash
sudo usermod -aG docker ${USER}
newgrp docker
```

Enable Docker on boot:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Open firewall (adjust to your setup):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Create app directory:

```bash
mkdir -p /home/ubuntu/chabaqa
```

---

## 4) Copy project files with SCP

From your local machine (or old VPS), copy the repository folder:

```bash
scp -r ${USER}@${OLD_HOST}:/home/ubuntu/chabaqa ${USER}@${NEW_HOST}:/home/ubuntu/
```

If you use a custom key:

```bash
scp -i ${SSH_KEY} -r ${USER}@${OLD_HOST}:/home/ubuntu/chabaqa ${USER}@${NEW_HOST}:/home/ubuntu/
```

Set ownership/permissions on new VPS:

```bash
ssh ${USER}@${NEW_HOST}
sudo chown -R ubuntu:ubuntu /home/ubuntu/chabaqa
find /home/ubuntu/chabaqa -type d -exec chmod 755 {} \;
find /home/ubuntu/chabaqa -type f -exec chmod 644 {} \;
chmod +x /home/ubuntu/chabaqa/deploy.sh || true
```

Protect env files:

```bash
chmod 600 /home/ubuntu/chabaqa/backend/.env
chmod 600 /home/ubuntu/chabaqa/frontend/.env
```

---

## 5) Create final data backups on old VPS (critical)

Back on old VPS:

```bash
ssh ${USER}@${OLD_HOST}
cd /home/ubuntu/chabaqa
mkdir -p ${BACKUP_DIR}
```

### 5.1 Put app in maintenance mode (recommended)

Goal: stop writes before final backup.

- Option A: temporarily block public traffic at reverse proxy.
- Option B: stop frontend/backend containers but keep DB containers alive.

Example (Option B):

```bash
sudo docker compose stop chabaqa-frontend chabaqa-backend
```

### 5.2 MongoDB dump

```bash
sudo docker exec chabaqa-mongo sh -c 'mongodump --archive=/tmp/chabaqa-mongo.archive --gzip'
sudo docker cp chabaqa-mongo:/tmp/chabaqa-mongo.archive ${BACKUP_DIR}/chabaqa-mongo.archive
```

### 5.3 Redis snapshot (optional but recommended)

```bash
sudo docker exec chabaqa-redis sh -c 'redis-cli -a "c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9" SAVE'
sudo docker cp chabaqa-redis:/data/dump.rdb ${BACKUP_DIR}/redis-dump.rdb
```

### 5.4 Uploads folder backup

```bash
tar -czf ${BACKUP_DIR}/backend-uploads.tar.gz -C /home/ubuntu/chabaqa/backend uploads
```

### 5.5 Optional named volume backup (HLS/output)

```bash
sudo docker run --rm -v chabaqa_backend-hls:/from -v ${BACKUP_DIR}:/to alpine sh -c 'cd /from && tar -czf /to/backend-hls.tar.gz .'
```

### 5.6 Checksums

```bash
cd ${BACKUP_DIR}
sha256sum chabaqa-mongo.archive redis-dump.rdb backend-uploads.tar.gz > checksums.sha256
```

### 5.7 Transfer backups to new VPS

```bash
scp -r ${BACKUP_DIR} ${USER}@${NEW_HOST}:/home/ubuntu/
```

---

## 6) Restore data on new VPS

SSH new VPS:

```bash
ssh ${USER}@${NEW_HOST}
cd /home/ubuntu/chabaqa
```

Start only DB containers first:

```bash
sudo docker compose up -d mongo redis
sudo docker compose ps
```

Verify backup integrity:

```bash
cd /home/ubuntu/chabaqa-migration-backup
sha256sum -c checksums.sha256
```

### 6.1 Restore MongoDB

```bash
sudo docker cp /home/ubuntu/chabaqa-migration-backup/chabaqa-mongo.archive chabaqa-mongo:/tmp/chabaqa-mongo.archive
sudo docker exec chabaqa-mongo sh -c 'mongorestore --drop --archive=/tmp/chabaqa-mongo.archive --gzip'
```

### 6.2 Restore Redis dump

```bash
sudo docker compose stop redis
sudo docker cp /home/ubuntu/chabaqa-migration-backup/redis-dump.rdb chabaqa-redis:/data/dump.rdb
sudo docker compose start redis
```

### 6.3 Restore uploads

```bash
mkdir -p /home/ubuntu/chabaqa/backend/uploads
tar -xzf /home/ubuntu/chabaqa-migration-backup/backend-uploads.tar.gz -C /home/ubuntu/chabaqa/backend
```

### 6.4 Restore optional HLS volume

```bash
sudo docker run --rm -v chabaqa_backend-hls:/to -v /home/ubuntu/chabaqa-migration-backup:/from alpine sh -c 'cd /to && tar -xzf /from/backend-hls.tar.gz'
```

---

## 7) Bring full app up on new VPS

From `/home/ubuntu/chabaqa`:

```bash
sudo docker compose build --no-cache
sudo docker compose up -d --force-recreate
sudo docker compose ps
```

Health checks:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8081/
```

Logs if needed:

```bash
sudo docker logs chabaqa-backend --tail 100
sudo docker logs chabaqa-frontend --tail 100
sudo docker logs chabaqa-mongo --tail 50
sudo docker logs chabaqa-redis --tail 50
```

---

## 8) Database parity verification (old vs new)

Run these on both old and new VPS and compare outputs.

### 8.1 MongoDB collection counts

```bash
sudo docker exec chabaqa-mongo mongosh --quiet --eval '
const dbName="chabaqa_local";
const d=db.getSiblingDB(dbName);
d.getCollectionNames().sort().forEach(c=>print(c+":"+d.getCollection(c).countDocuments({})));'
```

Save results:

```bash
sudo docker exec chabaqa-mongo mongosh --quiet --eval '
const dbName="chabaqa_local";
const d=db.getSiblingDB(dbName);
d.getCollectionNames().sort().forEach(c=>print(c+":"+d.getCollection(c).countDocuments({})));' > mongo-counts.txt
```

Then `scp` both files and diff:

```bash
diff -u old-mongo-counts.txt new-mongo-counts.txt
```

### 8.2 Key business sanity checks

Use a few critical collections for targeted checks:

```bash
# Example check pattern
sudo docker exec chabaqa-mongo mongosh --quiet --eval '
const d=db.getSiblingDB("chabaqa_local");
print("users="+d.users.countDocuments({}));
print("courses="+d.courses.countDocuments({}));
print("orders="+d.orders.countDocuments({}));
print("events="+d.events.countDocuments({}));'
```

### 8.3 Redis sanity check

```bash
sudo docker exec chabaqa-redis redis-cli -a "c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9" DBSIZE
```

---

## 9) DNS / reverse proxy cutover

- Point your domain (`chabaqa.io`) to new VPS IP.
- Ensure TLS certs are configured on new VPS (Nginx/Caddy/Traefik as used).
- Wait for DNS propagation.
- Re-test:
  - `https://chabaqa.io`
  - `https://chabaqa.io/api`
  - Google OAuth callback path
  - Stripe webhook endpoint

If webhooks use IP allowlists, update provider settings.

---

## 10) Post-migration checklist

- [ ] `docker compose ps` all services healthy
- [ ] backend API responds 200
- [ ] frontend loads correctly
- [ ] login works
- [ ] payment flow/webhook works
- [ ] file uploads + media access work
- [ ] key DB counts match old VPS
- [ ] cron/background jobs verified
- [ ] logs clean for 30-60 min

---

## 11) Rollback plan

If major issue appears after cutover:

1. Point DNS back to old VPS.
2. Restart app traffic on old VPS.
3. Keep new VPS for investigation.
4. Re-run migration after fix.

Do not destroy old VPS until production is stable for at least 24-72 hours.

---

## 12) Security hardening after move (important)

Your current `.env` contains sensitive credentials. After migration, rotate at minimum:

- JWT secrets
- email/app passwords
- Google OAuth secret
- Stripe/API keys
- OpenRouter/Ollama/GA4 keys
- Redis password

Then restart services:

```bash
cd /home/ubuntu/chabaqa
sudo docker compose up -d --force-recreate
```

---

## 13) One-command helpers (optional)

### On old VPS: create all backups quickly

```bash
cd /home/ubuntu/chabaqa
mkdir -p /home/ubuntu/chabaqa-migration-backup
sudo docker compose stop chabaqa-frontend chabaqa-backend
sudo docker exec chabaqa-mongo sh -c 'mongodump --archive=/tmp/chabaqa-mongo.archive --gzip'
sudo docker cp chabaqa-mongo:/tmp/chabaqa-mongo.archive /home/ubuntu/chabaqa-migration-backup/chabaqa-mongo.archive
sudo docker exec chabaqa-redis sh -c 'redis-cli -a "c25ec1b1cba859697df4d726baa3a30c7d0f21e0b1e5971f81fd99ebeb0a2fb9" SAVE'
sudo docker cp chabaqa-redis:/data/dump.rdb /home/ubuntu/chabaqa-migration-backup/redis-dump.rdb
tar -czf /home/ubuntu/chabaqa-migration-backup/backend-uploads.tar.gz -C /home/ubuntu/chabaqa/backend uploads
cd /home/ubuntu/chabaqa-migration-backup && sha256sum chabaqa-mongo.archive redis-dump.rdb backend-uploads.tar.gz > checksums.sha256
```

### Transfer everything to new VPS

```bash
scp -r /home/ubuntu/chabaqa-migration-backup ${USER}@${NEW_HOST}:/home/ubuntu/
```

---

Migration guide complete for `chabaqa` with SCP transfer, dependency installation, and Mongo/Redis parity workflow.
